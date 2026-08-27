<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $borrowings = Borrowing::with(['borrowingItems.item.category'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'data' => $this->payload($user, $borrowings),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'class' => 'sometimes|required|string|max:100',
            'password' => 'sometimes|nullable|string|min:8|confirmed',
            'profile_image' => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('profile_image')) {
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }

            $validated['profile_image'] = $request
                ->file('profile_image')
                ->store('profiles', 'public');
        }

        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $user->update($validated);

        $borrowings = Borrowing::with(['borrowingItems.item.category'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Profile berhasil diperbarui.',
            'data' => $this->payload($user->fresh(), $borrowings),
        ]);
    }

    private function payload($user, $borrowings): array
    {
        $today = now()->startOfDay();
        $outstanding = 0;
        $booksBorrowed = 0;
        $completed = 0;
        $forgotten = 0;
        $inProcess = 0;
        $categoryCounts = [];

        foreach ($borrowings as $borrowing) {
            $qty = $borrowing->borrowingItems->sum('quantity');

            if ($borrowing->status === 'Dipinjam') {
                $outstanding += $qty;
                $deadline = $borrowing->return_date
                    ? \Carbon\Carbon::parse($borrowing->return_date)->startOfDay()
                    : null;
                if ($deadline && $today->gt($deadline)) {
                    $forgotten++;
                }
            }

            if ($borrowing->status === 'Dikembalikan') {
                $completed++;
            }

            if (in_array($borrowing->status, ['Diajukan', 'Menunggu'], true)) {
                $inProcess++;
            }

            foreach ($borrowing->borrowingItems as $row) {
                $categoryName = $row->item?->category?->name ?? 'Lainnya';
                $categoryCounts[$categoryName] = ($categoryCounts[$categoryName] ?? 0) + $row->quantity;

                if (strcasecmp($categoryName, 'Buku') === 0) {
                    $booksBorrowed += $row->quantity;
                }
            }
        }

        $chart = [];
        foreach ($categoryCounts as $name => $count) {
            $chart[] = ['name' => $name, 'count' => $count];
        }

        usort($chart, fn ($a, $b) => $b['count'] <=> $a['count']);

        return [
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
            'outstanding_count' => $outstanding,
            'account_status' => $user->is_blocked ? 'Diblokir' : 'Baik',
            'stats' => [
                'books_borrowed' => $booksBorrowed,
                'completed' => $completed,
                'forgotten' => $forgotten,
                'in_process' => $inProcess,
            ],
            'category_chart' => $chart,
            'borrowings' => $borrowings,
        ];
    }
}
