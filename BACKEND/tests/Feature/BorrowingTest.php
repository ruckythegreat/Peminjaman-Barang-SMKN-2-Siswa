<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Category;
use App\Models\Item;
use App\Models\Borrowing;
use App\Models\BorrowingItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BorrowingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test 1:
     * Peminjaman ditolak jika stok tidak mencukupi.
     */
    public function test_peminjaman_ditolak_jika_stok_tidak_cukup(): void
    {
        $user = User::factory()->create();

        $category = Category::create([
            'name' => 'Laptop',
        ]);

        $item = Item::create([
            'category_id' => $category->id,
            'name' => 'Laptop Test',
            'code' => 'TEST-001',
            'stock' => 1,
            'condition' => 'Baik',
            'description' => 'Barang untuk testing',
        ]);

        $response = $this->actingAs($user)->postJson('/api/borrowings', [
            'borrowing_date' => '2026-08-27',
            'return_date' => '2026-08-30',
            'items' => [
                [
                    'item_id' => $item->id,
                    'quantity' => 2,
                ],
            ],
        ]);

        $response->assertStatus(422);
    }

    /**
     * Test 2:
     * Approve peminjaman mengurangi stok.
     */
    public function test_approve_mengurangi_stok(): void
    {
        $user = User::factory()->create();

        $category = Category::create([
            'name' => 'Laptop',
        ]);

        $item = Item::create([
            'category_id' => $category->id,
            'name' => 'Laptop Test',
            'code' => 'TEST-002',
            'stock' => 10,
            'condition' => 'Baik',
            'description' => 'Barang untuk testing',
        ]);

        $borrowing = Borrowing::create([
            'user_id' => $user->id,
            'borrowing_date' => '2026-08-27',
            'return_date' => '2026-08-30',
            'status' => 'Diajukan',
        ]);

        BorrowingItem::create([
            'borrowing_id' => $borrowing->id,
            'item_id' => $item->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/borrowings/{$borrowing->id}/approve");

        $response->assertStatus(200);

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'stock' => 8,
        ]);

        $this->assertDatabaseHas('borrowings', [
            'id' => $borrowing->id,
            'status' => 'Dipinjam',
        ]);
    }

    /**
     * Test 3:
     * Pengembalian menambah stok kembali.
     */
    public function test_return_menambah_stok(): void
    {
        $user = User::factory()->create();

        $category = Category::create([
            'name' => 'Laptop',
        ]);

        $item = Item::create([
            'category_id' => $category->id,
            'name' => 'Laptop Test',
            'code' => 'TEST-003',
            'stock' => 8,
            'condition' => 'Baik',
            'description' => 'Barang untuk testing',
        ]);

        $borrowing = Borrowing::create([
            'user_id' => $user->id,
            'borrowing_date' => '2026-08-27',
            'return_date' => '2026-08-30',
            'status' => 'Dipinjam',
        ]);

        BorrowingItem::create([
            'borrowing_id' => $borrowing->id,
            'item_id' => $item->id,
            'quantity' => 2,
        ]);
$response = $this->actingAs($user)
    ->postJson("/api/borrowings/{$borrowing->id}/return", [
        'return_condition' => 'Baik',
    ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'stock' => 10,
        ]);

        $this->assertDatabaseHas('borrowings', [
            'id' => $borrowing->id,
            'status' => 'Dikembalikan',
        ]);
    }

/** 
 * Test 4:
 * User mendapat +5 trust point jika mengembalikan tepat waktu
 * dan barang dalam kondisi baik.
 */
public function test_user_mendapat_trust_point_jika_mengembalikan_tepat_waktu()
{
    $user = User::factory()->create([
        'trust_points' => 50,
        'is_blocked' => false,
    ]);

    $item = Item::factory()->create([
        'stock' => 10,
    ]);

    $borrowing = Borrowing::factory()->create([
        'user_id' => $user->id,
        'borrowing_date' => now()->subDays(2)->toDateString(),
        'return_date' => now()->toDateString(),
        'status' => 'Dipinjam',
    ]);

    $borrowing->borrowingItems()->create([
        'item_id' => $item->id,
        'quantity' => 2,
    ]);

    $response = $this->actingAs($user)
        ->postJson("/api/borrowings/{$borrowing->id}/return", [
            'return_condition' => 'Baik',
        ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'trust_points' => 55,
        'is_blocked' => false,
    ]);
}

public function test_user_kehilangan_trust_point_jika_terlambat(): void
{
    $user = User::factory()->create([
        'trust_points' => 50,
        'is_blocked' => false,
    ]);

    $item = Item::factory()->create([
        'stock' => 10,
    ]);

    $borrowing = Borrowing::factory()->create([
        'user_id' => $user->id,
        'borrowing_date' => now()->subDays(5)->toDateString(),
        'return_date' => now()->subDays(1)->toDateString(),
        'status' => 'Dipinjam',
    ]);

    $borrowing->borrowingItems()->create([
        'item_id' => $item->id,
        'quantity' => 2,
    ]);

    $response = $this->actingAs($user)
        ->postJson("/api/borrowings/{$borrowing->id}/return", [
            'return_condition' => 'Baik',
        ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'trust_points' => 45,
        'is_blocked' => false,
    ]);
}

public function test_user_kehilangan_trust_point_jika_barang_rusak(): void
{
    $user = User::factory()->create([
        'trust_points' => 50,
        'is_blocked' => false,
    ]);

    $item = Item::factory()->create([
        'stock' => 10,
    ]);

    $borrowing = Borrowing::factory()->create([
        'user_id' => $user->id,
        'borrowing_date' => now()->subDays(2)->toDateString(),
        'return_date' => now()->toDateString(),
        'status' => 'Dipinjam',
    ]);

    $borrowing->borrowingItems()->create([
        'item_id' => $item->id,
        'quantity' => 2,
    ]);

    $response = $this->actingAs($user)
        ->postJson("/api/borrowings/{$borrowing->id}/return", [
            'return_condition' => 'Rusak',
        ]);

    $response->assertStatus(200);

    // Tepat waktu +5, rusak -10 = -5
    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'trust_points' => 45,
        'is_blocked' => false,
    ]);
}

public function test_user_diblokir_jika_trust_point_mencapai_nol(): void
{
    $user = User::factory()->create([
        'trust_points' => 5,
        'is_blocked' => false,
    ]);

    $item = Item::factory()->create([
        'stock' => 10,
    ]);

    $borrowing = Borrowing::factory()->create([
        'user_id' => $user->id,
        'borrowing_date' => now()->subDays(5)->toDateString(),
        'return_date' => now()->subDays(1)->toDateString(),
        'status' => 'Dipinjam',
    ]);

    $borrowing->borrowingItems()->create([
        'item_id' => $item->id,
        'quantity' => 2,
    ]);

    $response = $this->actingAs($user)
        ->postJson("/api/borrowings/{$borrowing->id}/return", [
            'return_condition' => 'Rusak',
        ]);

    $response->assertStatus(200);

    // 5 - 5 - 10 = 0
    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'trust_points' => 0,
        'is_blocked' => true,
    ]);
}

}

