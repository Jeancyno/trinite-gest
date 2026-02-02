<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'username' => 'admin',
            'password' => Hash::make('12345678'),
            'role' => 'super_admin',
        ]);
        
        Profile::create([
            'user_id' => $superAdmin->id,
            'poste' => 'Super Administrateur',
            'settings' => [
                'theme' => 'light',
                'language' => 'fr',
                'notifications' => true
            ]
        ]);

        // Pasteur
        $pasteur = User::create([
            'name' => 'Ambroise Bokete',
            'username' => 'pasteur',
            'password' => Hash::make('12345678'),
            'role' => 'pasteur',
        ]);
        
        Profile::create([
            'user_id' => $pasteur->id,
            'poste' => 'Pasteur Principal',
            'settings' => [
                'theme' => 'light',
                'language' => 'fr',
                'notifications' => true
            ]
        ]);

        // Secrétaire
        $secretaire = User::create([
            'name' => 'Secrétaire',
            'username' => 'secretaire',
            'password' => Hash::make('12345678'),
            'role' => 'secretaire',
        ]);
        
        Profile::create([
            'user_id' => $secretaire->id,
            'poste' => 'Secrétaire Général',
            'settings' => [
                'theme' => 'light',
                'language' => 'fr',
                'notifications' => true
            ]
        ]);

        // Trésorier
        $tresorier = User::create([
            'name' => 'Trésorier',
            'username' => 'tresorier',
            'password' => Hash::make('12345678'),
            'role' => 'tresorier',
        ]);
        
        Profile::create([
            'user_id' => $tresorier->id,
            'poste' => 'Trésorier Général',
            'settings' => [
                'theme' => 'light',
                'language' => 'fr',
                'notifications' => true
            ]
        ]);
    }
}