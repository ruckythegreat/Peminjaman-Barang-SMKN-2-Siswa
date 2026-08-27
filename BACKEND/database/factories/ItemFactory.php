<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class ItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'name' => 'Laptop Test',
            'code' => fake()->unique()->bothify('TEST-###'),
            'stock' => 10,
            'condition' => 'Baik',
            'description' => 'Barang untuk testing',
        ];
    }
}