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
    Schema::table('users', function (Blueprint $table) {
        $table->string('class')->nullable();
        $table->string('profile_image')->nullable();
        $table->integer('trust_points')->default(100);
        $table->boolean('is_blocked')->default(false);
    });
}

    /**
     * Reverse the migrations.
     */
public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn([
            'class',
            'profile_image',
            'trust_points',
            'is_blocked',
        ]);
    });
}
};
