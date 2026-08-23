<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use App\Http\Resources\ItemResource;

class ItemController extends Controller
{
public function index()
{
    $items = Item::with('category')->latest()->get();

    return ItemResource::collection($items);
}

public function store(Request $request)
{
    $validated = $request->validate([
        'category_id' => 'required|exists:categories,id',
        'name' => 'required|string|max:255',
        'code' => 'required|string|max:100|unique:items,code',
        'stock' => 'required|integer|min:0',
        'condition' => 'required|string|max:100',
        'description' => 'nullable|string',
    ]);

    $item = Item::create($validated);

    $item->load('category');

    return response()->json([
        'message' => 'Barang berhasil ditambahkan',
        'data' => new ItemResource($item),
    ], 201);
}

public function show(Item $item)
{
    $item->load('category');

    return new ItemResource($item);
}

    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:100|unique:items,code,' . $item->id,
            'stock' => 'required|integer|min:0',
            'condition' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $item->update($validated);

        return response()->json([
            'message' => 'Barang berhasil diperbarui',
            'data' => $item->load('category'),
        ]);
    }

    public function destroy(Item $item)
    {
        $item->delete();

        return response()->json([
            'message' => 'Barang berhasil dihapus',
        ]);
    }
}