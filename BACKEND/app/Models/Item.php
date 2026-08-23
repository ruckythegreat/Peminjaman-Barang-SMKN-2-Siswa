<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'code',
        'stock',
        'condition',
        'description',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function borrowingItems()
    {
        return $this->hasMany(BorrowingItem::class);
    }
}