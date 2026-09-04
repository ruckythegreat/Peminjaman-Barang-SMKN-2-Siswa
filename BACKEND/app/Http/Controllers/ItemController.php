<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use App\Http\Resources\ItemResource;
use Illuminate\Support\Facades\Storage;

class ItemController extends Controller
{
    public function index(Request $request)
    {
        $query = Item::with('category');

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('condition')) {
            $query->where('condition', $request->condition);
        }

        if ($request->filled('available')) {
            if ($request->boolean('available')) {
                $query->where('stock', '>', 0);
            } else {
                $query->where('stock', '<=', 0);
            }
        }

        if ($request->filled('category')) {
            $names = is_array($request->category)
                ? $request->category
                : explode(',', (string) $request->category);

            $query->whereHas('category', function ($q) use ($names) {
                $q->whereIn('name', $names);
            });
        }

        $items = $query->latest()->get();

        return ItemResource::collection($items);
    }

    public function store(Request $request)
    {
        $validated = $this->validatedPayload($request);

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
        $validated = $this->validatedPayload($request, $item);

        $item->update($validated);
        $item->load('category');

        return response()->json([
            'message' => 'Barang berhasil diperbarui',
            'data' => new ItemResource($item),
        ]);
    }

    public function destroy(Item $item)
    {
        if ($item->image) {
            Storage::disk('public')->delete($item->image);
        }

        $item->delete();

        return response()->json([
            'message' => 'Barang berhasil dihapus',
        ]);
    }

    private function validatedPayload(Request $request, ?Item $item = null): array
    {
        $codeRule = $item
            ? 'required|string|max:100|unique:items,code,' . $item->id
            : 'required|string|max:100|unique:items,code';

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'code' => $codeRule,
            'stock' => 'required|integer|min:0',
            'condition' => 'required|string|max:100',
            'description' => 'nullable|string',
            'image' => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        if ($request->hasFile('image')) {
            if ($item?->image) {
                Storage::disk('public')->delete($item->image);
            }

            $validated['image'] = $request
                ->file('image')
                ->store('items', 'public');
        } else {
            unset($validated['image']);
        }

        return $validated;
    }
}
