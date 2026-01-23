<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Facture;
use App\Models\AuditLog; // N'oubliez pas l'import !
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaiementController extends Controller
{
    public function index()
    {
        return Paiement::with(['membre', 'facture'])->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'membre_id'    => 'required|exists:membres,id',
            'promesse_id'  => 'nullable|exists:promesses,id',
            'montant_paye' => 'required|numeric|min:0',
            'devise'       => 'required|in:USD,CDF',
            'type_paiement'=> 'required|in:dime,construction,offrande',
            'mode_paiement'=> 'required|in:cash,orange_money,airtel_money,visa',
            'reference'    => 'nullable|string'
        ]);

        // La transaction englobe TOUT : Paiement, Facture et Audit
        $paiement = DB::transaction(function () use ($validated, $request) {
            
            // 1. Créer le paiement
            $paiement = Paiement::create([
                ...$validated,
                'perçu_par' => auth()->id(),
            ]);

            // 2. Générer la facture (Reçu)
            Facture::create([
                'paiement_id'    => $paiement->id,
                'numero_facture' => 'REC-' . strtoupper(Str::random(5)) . '-' . date('Ymd'),
                'date_impression'=> now(),
            ]);

            // 3. Enregistrer l'action dans le suivi (Audit)
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'CREATION_PAIEMENT',
                'table_concernee' => 'paiements',
                'description' => "Encaissement de {$validated['montant_paye']} {$validated['devise']} ({$validated['type_paiement']})",
                'ip_address' => $request->ip(),
            ]);

            return $paiement;
        });

        // Maintenant on peut retourner la réponse
        return response()->json([
            'message' => 'Paiement enregistré, reçu généré et action logguée',
            'data'    => $paiement->load(['membre', 'facture'])
        ], 201);
    }
}