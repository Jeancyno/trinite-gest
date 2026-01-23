<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Membre;
use Illuminate\Http\Request;

class MembreController extends Controller
{
    // Affiche la liste ou recherche un membre par nom/téléphone
    public function index(Request $request)
    {
        $search = $request->query('search');

        $membres = Membre::when($search, function ($query, $search) {
            return $query->where('nom', 'LIKE', "%{$search}%")
                         ->orWhere('postnom', 'LIKE', "%{$search}%")
                         ->orWhere('telephone', 'LIKE', "%{$search}%");
        })
        ->limit(10) // On limite pour la rapidité de l'autocomplétion
        ->get();

        return response()->json($membres);
    }

    // Enregistre un nouveau fidèle
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'postnom' => 'nullable|string|max:255',
            'prenom' => 'nullable|string|max:255',
            'sexe' => 'nullable|string|max:255',
            'telephone' => 'required|string|unique:membres,telephone',
            'adresse' => 'nullable|string',
        ]);

        $membre = Membre::create($validated);

        return response()->json([
            'message' => 'Fidèle enregistré avec succès',
            'membre' => $membre
        ], 201);
    }

    // Voir les détails d'un membre (avec ses promesses et paiements)
    public function show(Membre $membre)
    {
        return response()->json($membre->load(['promesses', 'paiements']));
    }
}