<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $superAdmin = User::firstOrNew([
            'email' => env('SEED_SUPER_ADMIN_EMAIL', 'superadmin@example.com'),
        ]);

        $superAdmin->name = env('SEED_SUPER_ADMIN_NAME', 'Super Admin');
        $superAdmin->password = Hash::make(env('SEED_SUPER_ADMIN_PASSWORD', 'ChangeMe123!'));
        $superAdmin->role = 'super_admin';
        $superAdmin->is_approved = true;

        $superAdmin->save();
    }
}
