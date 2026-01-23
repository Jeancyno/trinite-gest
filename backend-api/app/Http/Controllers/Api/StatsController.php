<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StatisticsCache;
use App\Models\Paiement;
use App\Models\Promesse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * Récupère les chiffres clés pour le Dashboard
     */
    public function getGlobalStats()
    {
        // On récupère la stat la plus récente (le mois en cours)
        $stats = StatisticsCache::latest()->first();

        // Si le cache est vide, on renvoie des zéros (sécurité)
        return response()->json($stats ?? [
            'construction_usd' => 0,
            'construction_cdf' => 0,
            'total_dime' => 0,
            'nombre_contributeurs' => 0,
            'taux_realisation_promesses' => 0
        ]);
    }

    /**
     * Graphique : Evolution des paiements sur les 6 derniers mois
     */
    public function getHistory()
    {
        $history = StatisticsCache::orderBy('periode', 'asc')
            ->limit(6)
            ->get(['periode', 'construction_totale', 'total_dime']);

        return response()->json($history);
    }

    /**
     * Analyse des promesses (pour le suivi du projet de construction)
     */
    public function getPromesseAnalysis()
    {
        $totalPromis = Promesse::sum('montant_total');
        $totalPaye = Paiement::whereNotNull('promesse_id')->sum('montant_paye');

        return response()->json([
            'global_promis' => $totalPromis,
            'global_paye' => $totalPaye,
            'pourcentage' => $totalPromis > 0 ? round(($totalPaye / $totalPromis) * 100, 2) : 0
        ]);
    }
}