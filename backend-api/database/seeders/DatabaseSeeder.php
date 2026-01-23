<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Membre;
use App\Models\Promesse;
use App\Models\Paiement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Création des Utilisateurs (Roles)
        User::create([
            'name' => 'Pasteur Principal',
            'username' => 'pasteur',
            'password' => Hash::make('eglise2026'),
            'role' => 'pasteur',
        ]);

        User::create([
            'name' => 'Secrétaire Sarah',
            'username' => 'sec_1',
            'password' => Hash::make('password'),
            'role' => 'secretaire_1',
        ]);

        // 2. Création de 10 Membres de test
        $membres = Membre::factory(10)->create();

        // 3. Ajouter une promesse et des paiements pour chaque membre
        foreach ($membres as $membre) {
            $promesse = Promesse::create([
                'membre_id' => $membre->id,
                'montant_total' => 500,
                'devise' => 'USD',
                'duree_mois' => 6,
                'date_debut' => now(),
            ]);

            // Simulation d'un premier versement pour la construction
            Paiement::create([
                'membre_id' => $membre->id,
                'promesse_id' => $promesse->id,
                'montant_paye' => 50,
                'devise' => 'USD',
                'type_paiement' => 'construction',
                'mode_paiement' => 'cash',
                'perçu_par' => 2, // ID de la secrétaire
            ]);
        }
    }
}