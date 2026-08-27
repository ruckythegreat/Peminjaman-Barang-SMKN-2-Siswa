<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'stock' => $this->stock,
            'condition' => $this->condition,
            'description' => $this->description,
            'image' => $this->image
                ? asset('storage/' . $this->image)
                : null,

            'category' => new CategoryResource($this->whenLoaded('category')),
        ];
    }
}