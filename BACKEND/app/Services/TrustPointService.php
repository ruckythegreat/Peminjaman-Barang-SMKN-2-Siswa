<?php

namespace App\Services;

use App\Models\User;

class TrustPointService
{
    /**
     * Tambah trust point.
     */
    public function reward(User $user, int $points): void
    {
        $user->trust_points = min(
            100,
            $user->trust_points + $points
        );

        $user->is_blocked = false;

        $user->save();
    }

    /**
     * Kurangi trust point.
     */
    public function penalize(User $user, int $points): void
    {
        $user->trust_points = max(
            0,
            $user->trust_points - $points
        );

        if ($user->trust_points <= 0) {
            $user->trust_points = 0;
            $user->is_blocked = true;
        }

        $user->save();
    }

    /**
     * Kembalikan tepat waktu.
     */
    public function rewardOnTime(User $user): void
    {
        $this->reward($user, 5);
    }

    /**
     * Kembalikan terlambat.
     */
    public function penaltyLate(User $user): void
    {
        $this->penalize($user, 10);
    }

    /**
     * Barang dikembalikan dalam kondisi rusak.
     */
    public function penaltyDamaged(User $user): void
    {
        $this->penalize($user, 20);
    }
}