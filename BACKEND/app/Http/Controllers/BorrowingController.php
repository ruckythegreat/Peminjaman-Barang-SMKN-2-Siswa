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

            // Cek semua stok sebelum membuat peminjaman
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

            // Buat data peminjaman
            $borrowing = Borrowing::create([
                'user_id' => $request->user()->id,
                'borrowing_date' => $validated['borrowing_date'],
                'return_date' => $validated['return_date'] ?? null,
                'status' => 'Diajukan',
            ]);

            // Masukkan barang yang dipinjam
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
}