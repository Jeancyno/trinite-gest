<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use Illuminate\Http\Request;

class FactureController extends Controller
{
    // Récupérer les détails d'une facture spécifique pour l'impression
    public function show($id)
    {
        // On charge le paiement, le membre et le percepteur pour avoir un reçu complet
        $facture = Facture::with(['paiement.membre', 'paiement.percepteur'])
            ->findOrFail($id);

        return response()->json($facture);
    }

    // Marquer qu'une facture a été réimprimée
    public function incrementPrint(Facture $facture)
    {
        $facture->increment('nombre_impressions');
        $facture->update(['date_impression' => now()]);

        return response()->json([
            'message' => 'Compteur d\'impression mis à jour',
            'nombre' => $facture->nombre_impressions
        ]);
    }

    // Liste des dernières factures pour le secrétariat
    public function index()
    {
        return Facture::with('paiement.membre')->latest()->paginate(15);
    }
}
