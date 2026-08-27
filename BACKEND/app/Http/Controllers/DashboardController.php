<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Category;
use App\Models\Borrowing;

class DashboardController extends Controller
{
    public function statistics()
    {
        return response()->json([
            'total_items' => Item::count(),

            'total_categories' => Category::count(),

            'total_borrowings' => Borrowing::count(),

            'pending_borrowings' => Borrowing::where(
                'status',
                'Diajukan'
            )->count(),

            'borrowed_borrowings' => Borrowing::where(
                'status',
                'Dipinjam'
            )->count(),

            'returned_borrowings' => Borrowing::where(
                'status',
                'Dikembalikan'
            )->count(),
        ]);
    }
}