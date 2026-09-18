<?php

namespace Database\Seeders;

use App\Models\Registrations\Admin\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::create([
            'name' => 'Winston Hanun Júnior',
            'email' => 'devjuniorhanun@gmail.com',
            'password' => Hash::make('Linux1009'),
        ]);
        $user->roles()->sync(1);
    }
}
