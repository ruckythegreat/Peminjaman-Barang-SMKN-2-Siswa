<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@barangky.test'],
            [
                'name' => 'Admin BarangKy',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'class' => 'Staf',
                'trust_points' => 100,
                'is_blocked' => false,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'siswa@barangky.test'],
            [
                'name' => 'Siswa Demo',
                'password' => Hash::make('password'),
                'role' => 'user',
                'class' => 'XII RPL 1',
                'trust_points' => 100,
                'is_blocked' => false,
            ]
        );

        $alat = Category::query()->firstOrCreate(['name' => 'Alat']);
        $buku = Category::query()->firstOrCreate(['name' => 'Buku']);
        $lainnya = Category::query()->firstOrCreate(['name' => 'Lainnya']);

        $catalog = [
            ['category_id' => $alat->id, 'name' => 'Obeng Plus', 'code' => 'ALT-001', 'stock' => 12, 'condition' => 'Baik', 'description' => 'Obeng plus ukuran sedang.'],
            ['category_id' => $alat->id, 'name' => 'Tang Kombinasi', 'code' => 'ALT-002', 'stock' => 8, 'condition' => 'Baik', 'description' => 'Tang kombinasi bengkel.'],
            ['category_id' => $alat->id, 'name' => 'Multimeter Digital', 'code' => 'ALT-003', 'stock' => 4, 'condition' => 'Baik', 'description' => 'Alat ukur listrik digital.'],
            ['category_id' => $alat->id, 'name' => 'Solder Listrik', 'code' => 'ALT-004', 'stock' => 0, 'condition' => 'Baik', 'description' => 'Stok habis, sedang dalam perawatan.'],
            ['category_id' => $buku->id, 'name' => 'Pemrograman Web', 'code' => 'BKU-001', 'stock' => 15, 'condition' => 'Baik', 'description' => 'Buku ajar pemrograman web.'],
            ['category_id' => $buku->id, 'name' => 'Jaringan Komputer', 'code' => 'BKU-002', 'stock' => 9, 'condition' => 'Baik', 'description' => 'Modul jaringan komputer.'],
            ['category_id' => $buku->id, 'name' => 'Basis Data', 'code' => 'BKU-003', 'stock' => 6, 'condition' => 'Baik', 'description' => 'Buku basis data relasional.'],
            ['category_id' => $lainnya->id, 'name' => 'Proyektor Portable', 'code' => 'LNY-001', 'stock' => 3, 'condition' => 'Baik', 'description' => 'Proyektor untuk presentasi kelas.'],
            ['category_id' => $lainnya->id, 'name' => 'Speaker Bluetooth', 'code' => 'LNY-002', 'stock' => 5, 'condition' => 'Baik', 'description' => 'Speaker portabel ruang kelas.'],
            ['category_id' => $lainnya->id, 'name' => 'Extension Cable', 'code' => 'LNY-003', 'stock' => 10, 'condition' => 'Baik', 'description' => 'Kabel roll 10 meter.'],
        ];

        foreach ($catalog as $item) {
            Item::query()->updateOrCreate(
                ['code' => $item['code']],
                $item
            );
        }
    }
}
