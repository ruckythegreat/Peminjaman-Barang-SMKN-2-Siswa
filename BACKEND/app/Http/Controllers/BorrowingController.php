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
        $validated = $request->validate([
            'borrowing_date' => 'required|date',
            'return_date' => 'nullable|date|after_or_equal:borrowing_date',

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
    $borrowings = Borrowing::with([
        'user',
        'borrowingItems.item'
    ])
    ->latest()
    ->get();

    return response()->json([
        'data' => $borrowings
    ]);
}

public function approve($id)
{
    return DB::transaction(function () use ($id) {

        $borrowing = Borrowing::with('borrowingItems.item')
            ->lockForUpdate()
            ->findOrFail($id);

        if ($borrowing->status !== 'Diajukan') {
            return response()->json([
                'message' => 'Peminjaman ini sudah diproses.'
            ], 422);
        }

        // Cek stok terlebih dahulu
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

        // Kurangi stok
        foreach ($borrowing->borrowingItems as $borrowingItem) {

            $item = Item::lockForUpdate()
                ->findOrFail($borrowingItem->item_id);

            $item->decrement(
                'stock',
                $borrowingItem->quantity
            );
        }

        // Ubah status
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

public function reject($id)
{
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

public function returnBorrowing($id)
{
    $borrowing = Borrowing::with('borrowingItems.item')->findOrFail($id);

    if ($borrowing->status !== 'Dipinjam') {
        return response()->json([
            'message' => 'Peminjaman tidak dapat dikembalikan.'
        ], 400);
    }

    DB::transaction(function () use ($borrowing) {
        foreach ($borrowing->borrowingItems as $borrowingItem) {
            $item = $borrowingItem->item;

            $item->increment('stock', $borrowingItem->quantity);
        }

        $borrowing->update([
            'status' => 'Dikembalikan',
        ]);
    });

    return response()->json([
        'message' => 'Barang berhasil dikembalikan.',
        'data' => $borrowing->fresh([
            'user',
            'borrowingItems.item'
        ]),
    ]);
}

}