<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BorrowingController extends Controller
{
    public function store(Request $request)
    {
        // Cek apakah user diblokir
        if ($request->user()->is_blocked) {
            return response()->json([
                'message' => 'Akun Anda diblokir dan tidak dapat melakukan peminjaman.'
            ], 403);
        }

        $validated = $request->validate([
            'borrowing_date' => 'required|date',
            'return_date' => 'nullable|date|after_or_equal:borrowing_date',
            'reason' => 'nullable|string|max:2000',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($validated, $request) {

            foreach ($validated['items'] as $borrowedItem) {
                $item = Item::findOrFail($borrowedItem['item_id']);

                if ($item->stock <= 0) {
                    return response()->json([
                        'message' => "Barang {$item->name} sedang tidak tersedia."
                    ], 422);
                }

                if ($borrowedItem['quantity'] > $item->stock) {
                    return response()->json([
                        'message' => "Stok {$item->name} tidak mencukupi.",
                        'available_stock' => $item->stock,
                        'requested_quantity' => $borrowedItem['quantity'],
                    ], 422);
                }
            }

            $borrowing = Borrowing::create([
                'user_id' => $request->user()->id,
                'borrowing_date' => $validated['borrowing_date'],
                'return_date' => $validated['return_date'] ?? null,
                'status' => 'Diajukan',
                'reason' => $validated['reason'] ?? null,
            ]);

            foreach ($validated['items'] as $borrowedItem) {
                $borrowing->borrowingItems()->create([
                    'item_id' => $borrowedItem['item_id'],
                    'quantity' => $borrowedItem['quantity'],
                ]);
            }

            return response()->json([
                'message' => 'Pengajuan peminjaman berhasil dibuat.',
                'data' => $borrowing->load('borrowingItems.item'),
            ], 201);
        });
    }

    public function index(Request $request)
    {
        $query = Borrowing::with([
            'user',
            'borrowingItems.item.category',
        ]);

        if ($request->user()->role !== 'admin') {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'data' => $query->latest()->get(),
        ]);
    }

    public function approve(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Hanya admin yang dapat menyetujui peminjaman.'], 403);
        }

        return DB::transaction(function () use ($id) {

            $borrowing = Borrowing::with('borrowingItems.item')
                ->lockForUpdate()
                ->findOrFail($id);

            if ($borrowing->status !== 'Diajukan') {
                return response()->json([
                    'message' => 'Peminjaman ini sudah diproses.'
                ], 422);
            }

            foreach ($borrowing->borrowingItems as $borrowingItem) {

                $item = Item::lockForUpdate()
                    ->findOrFail($borrowingItem->item_id);

                if ($item->stock < $borrowingItem->quantity) {
                    return response()->json([
                        'message' => "Stok {$item->name} tidak mencukupi.",
                        'available_stock' => $item->stock,
                        'requested_quantity' => $borrowingItem->quantity,
                    ], 422);
                }
            }

            foreach ($borrowing->borrowingItems as $borrowingItem) {

                $item = Item::lockForUpdate()
                    ->findOrFail($borrowingItem->item_id);

                $item->decrement(
                    'stock',
                    $borrowingItem->quantity
                );
            }

            $borrowing->update([
                'status' => 'Dipinjam'
            ]);

            return response()->json([
                'message' => 'Peminjaman berhasil disetujui.',
                'data' => $borrowing->fresh([
                    'user',
                    'borrowingItems.item'
                ])
            ]);
        });
    }

    public function reject(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Hanya admin yang dapat menolak peminjaman.'], 403);
        }

        $borrowing = Borrowing::findOrFail($id);

        if ($borrowing->status !== 'Diajukan') {
            return response()->json([
                'message' => 'Peminjaman ini sudah diproses.'
            ], 422);
        }

        $borrowing->update([
            'status' => 'Ditolak'
        ]);

        return response()->json([
            'message' => 'Peminjaman berhasil ditolak.',
            'data' => $borrowing
        ]);
    }

public function returnBorrowing(Request $request, $id)
{
    $validated = $request->validate([
        'return_condition' => 'required|in:Baik,Rusak',
    ]);

    return DB::transaction(function () use ($validated, $id) {

        $borrowing = Borrowing::with('borrowingItems.item', 'user')
            ->lockForUpdate()
            ->findOrFail($id);

        if ($borrowing->status !== 'Dipinjam') {
            return response()->json([
                'message' => 'Peminjaman tidak dapat dikembalikan.',
            ], 400);
        }

        $user = $borrowing->user;

        // Kembalikan stok
        foreach ($borrowing->borrowingItems as $borrowingItem) {
            $item = Item::lockForUpdate()
                ->findOrFail($borrowingItem->item_id);

            $item->increment('stock', $borrowingItem->quantity);

            // Simpan kondisi barang ketika dikembalikan
            $borrowingItem->update([
                'return_condition' => $validated['return_condition'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | TRUST POINT
        |--------------------------------------------------------------------------
        */

        $today = now()->startOfDay();
        $deadline = \Carbon\Carbon::parse($borrowing->return_date)->startOfDay();

        $trustChange = 0;

        // Tepat waktu
        if ($today->lte($deadline)) {
            $trustChange += 5;
        } else {
            // Terlambat
            $trustChange -= 5;
        }

        // Barang rusak
        if ($validated['return_condition'] === 'Rusak') {
            $trustChange -= 10;
        }

        // Update trust point
        $newTrustPoints = max(
            0,
            min(100, $user->trust_points + $trustChange)
        );

        $user->update([
            'trust_points' => $newTrustPoints,
            'is_blocked' => $newTrustPoints <= 0,
        ]);

        // Ubah status peminjaman
        $borrowing->update([
            'status' => 'Dikembalikan',
        ]);

        return response()->json([
            'message' => 'Barang berhasil dikembalikan.',
            'trust_point_change' => $trustChange,
            'trust_points' => $newTrustPoints,
            'is_blocked' => $newTrustPoints <= 0,
            'data' => $borrowing->fresh([
                'user',
                'borrowingItems.item',
            ]),
        ]);
    });
}
}