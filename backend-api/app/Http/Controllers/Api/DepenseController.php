<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Depense;
use App\Models\Dime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DepenseController extends Controller
{
    public function index() 
    {
        return response()->json([
            'success' => true,
            'data' => Depense::with('secretaire:id,name')->orderBy('created_at', 'desc')->paginate(10)
        ]);
    }

    public function getSoldes()
    {
        $sources = ['dime', 'construction'];
        $devises = ['USD', 'CDF'];
        $stats = [];

        foreach ($sources as $src) {
            foreach ($devises as $dev) {
                $stats[$src][$dev] = $this->calculerSolde($src, $dev);
            }
        }

        return response()->json([
            'success' => true,
            'soldes' => $stats
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'motif' => 'required|string|max:255',
            'montant' => 'required|numeric|min:1',
            'devise' => 'required|in:USD,CDF',
            'source' => 'required|in:dime,construction',
            'date_depense' => 'required|date',
            'details' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $soldeDisponible = $this->calculerSolde($request->source, $request->devise);

        if ($request->montant > $soldeDisponible) {
            return response()->json([
                'success' => false,
                'message' => "Fonds insuffisants. Solde actuel : {$soldeDisponible} {$request->devise}"
            ], 400);
        }

        try {
            $depense = Depense::create([
                'motif' => $request->motif,
                'montant' => $request->montant,
                'devise' => $request->devise,
                'source' => $request->source,
                'date_depense' => $request->date_depense,
                'user_id' => auth()->id() ?? 1,
                'details' => $request->details
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Dépense enregistrée.',
                'data' => $depense
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

   private function calculerSolde($source, $devise)
{
    if ($source === 'dime') {
        return (float) DB::table('dimes')
            ->where('devise', $devise)
            ->sum('montant') - DB::table('depenses')
            ->where('source', 'dime')
            ->where('devise', $devise)
            ->sum('montant');
    } else {
        // La Caisse Construction lit directement la table promesses
        $entrees = DB::table('promesses')
            ->where('devise', $devise)
            ->where('statut', 'actif')
            ->sum('montant_total') ?? 0;

        $sorties = DB::table('depenses')
            ->where('source', 'construction')
            ->where('devise', $devise)
            ->sum('montant') ?? 0;

        return (float) ($entrees - $sorties);
    }
}
    /**
     * Obtenir les statistiques globales des dépenses pour le Dashboard
     */
    public function stats()
    {
        try {
            // On récupère le total des dépenses par devise
            $totalUSD = Depense::where('devise', 'USD')->sum('montant');
            $totalCDF = Depense::where('devise', 'CDF')->sum('montant');

            return response()->json([
                'success' => true,
                'data' => [
                    'usd' => (float) $totalUSD,
                    'cdf' => (float) $totalCDF,
                    'total_count' => Depense::count()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur stats dépenses: ' . $e->getMessage()
            ], 500);
        }
    }
}