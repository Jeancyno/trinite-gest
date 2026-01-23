<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Membre;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaiementApiTest extends TestCase
{
    use RefreshDatabase; // Vide la base de test à chaque fois

    public function test_un_secretaire_peut_enregistrer_un_paiement()
    {
        // 1. Créer un utilisateur et un membre
        $user = User::factory()->create(['role' => 'secretaire_1']);
        $membre = Membre::factory()->create();

        // 2. Simuler la connexion (Sanctum)
        $this->actingAs($user);

        // 3. Envoyer une requête de paiement
        $response = $this->postJson('/api/paiements', [
            'membre_id' => $membre->id,
            'montant_paye' => 100,
            'devise' => 'USD',
            'type_paiement' => 'dime',
            'mode_paiement' => 'cash',
        ]);

        // 4. Vérifier que ça a marché (Status 201 Created)
        $response->assertStatus(201);
        $this->assertDatabaseHas('paiements', ['montant_paye' => 100]);
        $this->assertDatabaseHas('factures', ['paiement_id' => $response['data']['id']]);
    }
}