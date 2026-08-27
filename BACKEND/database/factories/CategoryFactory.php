<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use HasFactory;

class CategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
        ];
    }
}