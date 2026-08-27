<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BorrowingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'borrowing_date' => now()->subDays(2)->toDateString(),
            'return_date' => now()->toDateString(),
            'status' => 'Dipinjam',
        ];
    }
}