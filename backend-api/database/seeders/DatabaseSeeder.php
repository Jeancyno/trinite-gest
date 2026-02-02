<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Membre;
use App\Models\Promesse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Appel du UserSeeder
        $this->call([
            UserSeeder::class,
        ]);

        // 2. Création des membres (on stocke les objets pour les réutiliser)
        $john = Membre::create([
            'nom' => 'Doe', 
            'postnom' => 'Kadi', 
            'prenom' => 'John', 
            'sexe' => 'M', 
            'telephone' => '+243 81 234 5678', 
            'adresse' => 'Goma',
            'photo' => null
        ]);

        $marie = Membre::create([
            'nom' => 'Smith', 
            'postnom' => 'Musa',
            'prenom' => 'Marie', 
            'sexe' => 'F', 
            'telephone' => '+243 82 345 6789', 
            'adresse' => 'Kinshasa',
            'photo' => null
        ]);

        // 3. Création des engagements (Promesses)
        
        // Engagement en Dollars pour John
        Promesse::create([
            'membre_id' => $john->id,
            'montant_total' => 500.00,
            'devise' => 'USD',
            'duree_mois' => 12,
            'date_debut' => now(),
            'date_fin' => now()->addMonths(12),
            'statut' => 'actif',
            'observation' => 'Engagement en dollars'
        ]);

        // Engagement en Francs (CDF) pour Marie
        Promesse::create([
            'membre_id' => $marie->id,
            'montant_total' => 250000.00,
            'devise' => 'CDF',
            'duree_mois' => 6,
            'date_debut' => now(),
            'date_fin' => now()->addMonths(6),
            'statut' => 'actif',
            'observation' => 'Engagement en francs congolais'
        ]);

        // 4. Créer un membre sans engagement pour tester les listes vides
        Membre::create([
            'nom' => 'Jones',
            'postnom' => 'Kasongo',
            'prenom' => 'Paul',
            'sexe' => 'M',
            'telephone' => '+243 83 456 7890',
            'adresse' => 'Lubumbashi',
            'photo' => null
        ]);
    }
}