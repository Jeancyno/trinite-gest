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

            // 🔥 CORRECTION : CRÉER LA NOTIFICATION
          // 🔥 CORRECTION : APPEL DU BON NAMESPACE
            if ($depense) {
                try {
                    // Utilisation du chemin complet exact tel que vérifié dans Tinker
                    $notificationClass = \App\Http\Controllers\Api\NotificationController::class;

                    if (class_exists($notificationClass)) {
                        $notificationClass::createExpenseNotification(
                            $depense, 
                            auth()->user()
                        );
                        \Log::info('✅ Notification de dépense créée pour ID: ' . $depense->id);
                    } else {
                        \Log::warning('⚠️ NotificationController non trouvé à l\'adresse: ' . $notificationClass);
                    }
                } catch (\Exception $e) {
                    \Log::error('❌ Erreur critique notification dépense: ' . $e->getMessage());
                }
            }

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
    $devise = strtoupper($devise); // Sécurité : USD ou CDF

    if ($source === 'dime') {
        // On cible la colonne spécifique à la devise
        $colonne = ($devise === 'USD') ? 'montant_usd' : 'montant_cdf';

        $entrees = DB::table('dimes')
            ->sum($colonne) ?? 0;

        $sorties = DB::table('depenses')
            ->where('source', 'dime')
            ->where('devise', $devise)
            ->sum('montant') ?? 0;

        return (float) ($entrees - $sorties);
    } else {
        // Caisse Construction (reste inchangé si ta table promesses est ok)
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
        // Totaux Généraux
        $totalUSD = Depense::where('devise', 'USD')->sum('montant');
        $totalCDF = Depense::where('devise', 'CDF')->sum('montant');

        // Détails par Source (C'est ce qui manquait !)
        $constructionUSD = Depense::where('source', 'construction')->where('devise', 'USD')->sum('montant');
        $constructionCDF = Depense::where('source', 'construction')->where('devise', 'CDF')->sum('montant');
        
        $dimeUSD = Depense::where('source', 'dime')->where('devise', 'USD')->sum('montant');
        $dimeCDF = Depense::where('source', 'dime')->where('devise', 'CDF')->sum('montant');

        return response()->json([
            'success' => true,
            'data' => [
                'usd' => (float) $totalUSD,
                'cdf' => (float) $totalCDF,
                'construction_usd' => (float) $constructionUSD,
                'construction_cdf' => (float) $constructionCDF,
                'dime_usd' => (float) $dimeUSD,
                'dime_cdf' => (float) $dimeCDF,
                'total_count' => Depense::count(),
                'derniere_date' => Depense::latest('date_depense')->value('date_depense')
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}
}

