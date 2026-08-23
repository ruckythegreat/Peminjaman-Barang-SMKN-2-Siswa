<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::create('borrowing_items', function (Blueprint $table) {
        $table->id();

        $table->foreignId('borrowing_id')
            ->constrained('borrowings')
            ->cascadeOnDelete();

        $table->foreignId('item_id')
            ->constrained('items')
            ->cascadeOnDelete();

        $table->integer('quantity')->default(1);

        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrowing_items');
    }
};
