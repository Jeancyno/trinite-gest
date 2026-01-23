<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promesse;
use Illuminate\Http\Request;

class PromesseController extends Controller
{
    // Lister les promesses (avec filtre par membre si besoin)
    public function index(Request $request)
    {
        $membre_id = $request->query('membre_id');

        $promesses = Promesse::with('membre')
            ->when($membre_id, function ($query, $membre_id) {
                return $query->where('membre_id', $membre_id);
            })
            ->latest()
            ->get();

        return response()->json($promesses);
    }

    // Enregistrer une nouvelle promesse
    public function store(Request $request)
    {
        $validated = $request->validate([
            'membre_id' => 'required|exists:membres,id',
            'montant_total' => 'required|numeric|min:0',
            'devise' => 'required|in:USD,CDF',
            'duree_mois' => 'required|integer|min:1',
            'date_debut' => 'required|date',
            'observation' => 'nullable|string'
        ]);

        $promesse = Promesse::create($validated);

        return response()->json([
            'message' => 'Engagement enregistré',
            'promesse' => $promesse
        ], 201);
    }
}
