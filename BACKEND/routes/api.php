<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\BorrowingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;

Route::get('/health', function () {
    return response()->json([
        'ok' => true,
        'message' => 'API Peminjaman BarangKy siap.',
    ]);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'class' => $user->class,
            'role' => $user->role,
            'profile_image' => $user->profile_image
                ? asset('storage/' . $user->profile_image)
                : null,
            'trust_points' => $user->trust_points,
            'is_blocked' => (bool) $user->is_blocked,
        ]);
    });

    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('items', ItemController::class);

    Route::post('/borrowings', [BorrowingController::class, 'store']);

    Route::get('/borrowings', [BorrowingController::class, 'index']);

    Route::post('/borrowings/{id}/approve', [BorrowingController::class, 'approve']);

    Route::post('/borrowings/{id}/reject', [BorrowingController::class, 'reject']);
    Route::post('/borrowings/{id}/return', [BorrowingController::class, 'returnBorrowing']);
    Route::get('/dashboard/statistics', [DashboardController::class, 'statistics']);
    
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'update']);
});