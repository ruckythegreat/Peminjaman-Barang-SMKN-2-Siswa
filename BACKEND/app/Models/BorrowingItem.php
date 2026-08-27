<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BorrowingItem extends Model
{
    protected $fillable = [
        'borrowing_id',
        'item_id',
        'quantity',
        'return_condition',
    ];

    public function borrowing()
    {
        return $this->belongsTo(Borrowing::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}