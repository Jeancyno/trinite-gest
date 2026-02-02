<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dime;
use App\Models\Membre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DimeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $query = Dime::with(['membre:id,nom,prenom,postnom', 'enregistreur:id,name']);
            
            // Filtrage par période
            if ($request->has('debut') && $request->has('fin')) {
                $query->whereBetween('date_versement', [$request->debut, $request->fin]);
            }
            
            // Filtrage par mois
            if ($request->has('mois')) {
                $query->where('mois', $request->mois);
            }
            
            // Filtrage par membre
            if ($request->has('membre_id')) {
                $query->where('membre_id', $request->membre_id);
            }
            
            // Filtrage par méthode de paiement
            if ($request->has('methode')) {
                $query->where('methode_paiement', $request->methode);
            }
            
            // Recherche
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->whereHas('membre', function($q2) use ($search) {
                        $q2->where('nom', 'like', "%{$search}%")
                           ->orWhere('prenom', 'like', "%{$search}%")
                           ->orWhere('postnom', 'like', "%{$search}%");
                    })->orWhere('note', 'like', "%{$search}%")
                      ->orWhere('methode_paiement', 'like', "%{$search}%")
                      ->orWhere('mois', 'like', "%{$search}%");
                });
            }
            
            // Tri
            $sortBy = $request->get('sort_by', 'date_versement');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Pagination
            $perPage = $request->get('per_page', 10);
            $dimes = $query->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'data' => $dimes,
                'message' => 'Liste des dîmes récupérée avec succès'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erreur DimeController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des dîmes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
 public function store(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'membre_id' => 'required|exists:membres,id',
            'devise' => 'required|string|in:USD,CDF',
            'montant_usd' => 'nullable|numeric|min:0',
            'montant_cdf' => 'nullable|numeric|min:0',
            'mois' => 'required|string',
            'date_versement' => 'required|date',
            'methode_paiement' => 'required|string|in:Espèces,Mobile Money,Banque,Virement,Carte de crédit,Chèque,Autre',
            'note' => 'nullable|string|max:500',
            'enregistre_par' => 'required|exists:users,id'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }
        
        // Initialiser les données
        $data = [
            'membre_id' => $request->membre_id,
            'devise' => $request->devise,
            'mois' => $request->mois,
            'date_versement' => $request->date_versement,
            'methode_paiement' => $request->methode_paiement,
            'note' => $request->note,
            'enregistre_par' => $request->enregistre_par,
        ];
        
        // Remplir les colonnes selon la devise
        if ($request->devise === 'USD') {
            $data['montant_usd'] = $request->montant_usd ?? $request->montant ?? 0;
            $data['montant_cdf'] = 0;
        } else { // CDF
            $data['montant_cdf'] = $request->montant_cdf ?? $request->montant ?? 0;
            $data['montant_usd'] = 0;
        }
        
        $dime = Dime::create($data);
        
        return response()->json([
            'success' => true,
            'data' => $dime->load(['membre:id,nom,prenom,postnom', 'enregistreur:id,name']),
            'message' => 'Dîme enregistrée avec succès'
        ], 201);
        
    } catch (\Exception $e) {
        \Log::error('Erreur DimeController@store: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de l\'enregistrement de la dîme: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            // Vérifiez si $id est "statistiques" et redirigez vers la bonne méthode
            if ($id === 'statistiques') {
                return $this->statistiques(request());
            }
            
            // Sinon, cherchez la dime normalement
            $dime = Dime::with(['membre', 'enregistreur'])->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $dime,
                'message' => 'Dîme récupérée avec succès'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erreur DimeController@show: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la dîme: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $dime = Dime::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'membre_id' => 'sometimes|exists:membres,id',
                'montant' => 'sometimes|numeric|min:0',
                'devise' => 'sometimes|string|max:3|in:USD,CDF,EUR',
                'montant_usd' => 'sometimes|numeric|min:0',
                'montant_cdf' => 'sometimes|numeric|min:0',
                'mois' => 'sometimes|string',
                'date_versement' => 'sometimes|date',
                'methode_paiement' => 'sometimes|string|in:Espèces,Mobile Money,Banque,Virement,Carte de crédit,Chèque,Autre',
                'note' => 'nullable|string|max:500',
                'enregistre_par' => 'sometimes|exists:users,id'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                    'message' => 'Validation failed'
                ], 422);
            }
            
            // Si on reçoit les montants séparés
            if ($request->has('montant_usd') || $request->has('montant_cdf')) {
                $dime->montant_usd = $request->montant_usd ?? $dime->montant_usd;
                $dime->montant_cdf = $request->montant_cdf ?? $dime->montant_cdf;
                
                // Calculer le montant total pour compatibilité
                $tauxChange = 2500;
                $montantTotal = $dime->montant_usd + ($dime->montant_cdf / $tauxChange);
                $dime->montant = $montantTotal;
                
                // Mettre à jour la devise si nécessaire
                if ($request->has('devise')) {
                    $dime->devise = $request->devise;
                } elseif ($dime->montant_usd > 0) {
                    $dime->devise = 'USD';
                } elseif ($dime->montant_cdf > 0) {
                    $dime->devise = 'CDF';
                }
            }
            
            // Mettre à jour les autres champs
            $updateData = $request->only([
                'membre_id', 'mois', 'date_versement', 
                'methode_paiement', 'note', 'enregistre_par'
            ]);
            
            $dime->update($updateData);
            
            return response()->json([
                'success' => true,
                'data' => $dime->load(['membre:id,nom,prenom,postnom', 'enregistreur:id,name']),
                'message' => 'Dîme mise à jour avec succès'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erreur DimeController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la dîme: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $dime = Dime::findOrFail($id);
            $dime->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Dîme supprimée avec succès'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erreur DimeController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la dîme: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les statistiques des dîmes.
     */
    public function statistiques(Request $request)
    {
        try {
            $debut = $request->get('debut', Carbon::now()->startOfMonth()->toDateString());
            $fin = $request->get('fin', Carbon::now()->endOfMonth()->toDateString());
            
            // Utiliser les nouvelles colonnes montant_usd et montant_cdf
            $totalUSD = Dime::whereBetween('date_versement', [$debut, $fin])
                ->sum('montant_usd');
            
            $totalCDF = Dime::whereBetween('date_versement', [$debut, $fin])
                ->sum('montant_cdf');
            
            // Total converti en USD pour compatibilité
            $tauxChange = 2500; // 1 USD = 2500 CDF
            $totalPerçuUSD = $totalUSD + ($totalCDF / $tauxChange);
            
            // Nombre total de paiements
            $totalPaiements = Dime::whereBetween('date_versement', [$debut, $fin])->count();
            
            // Membres actifs (qui ont payé)
            $membresActifs = Dime::whereBetween('date_versement', [$debut, $fin])
                ->where(function($query) {
                    $query->where('montant_usd', '>', 0)
                          ->orWhere('montant_cdf', '>', 0);
                })
                ->distinct('membre_id')
                ->count('membre_id');
            
            // Total membres
            $totalMembres = Membre::count();
            
            // Taux de participation
            $tauxParticipation = $totalMembres > 0 ? ($membresActifs / $totalMembres) * 100 : 0;
            
            // Statistiques par méthode de paiement (utiliser montant total)
            $statsMethodes = Dime::whereBetween('date_versement', [$debut, $fin])
                ->select('methode_paiement', 
                    DB::raw('SUM(montant_usd + montant_cdf) as total'), 
                    DB::raw('COUNT(*) as nombre'))
                ->groupBy('methode_paiement')
                ->get();
            
            // Statistiques par mois (6 derniers mois)
            $sixMois = Carbon::now()->subMonths(5)->startOfMonth();
            $statsMois = Dime::where('date_versement', '>=', $sixMois)
                ->select('mois', 
                    DB::raw('SUM(montant_usd + montant_cdf) as total'), 
                    DB::raw('COUNT(*) as nombre'))
                ->groupBy('mois')
                ->orderBy('mois')
                ->get();
            
            // Top contributeurs (5 premiers) - utiliser montant total
            $topContributeurs = Dime::whereBetween('date_versement', [$debut, $fin])
                ->with('membre:id,nom,prenom,postnom')
                ->select('membre_id', 
                    DB::raw('SUM(montant_usd + montant_cdf) as total'))
                ->groupBy('membre_id')
                ->orderByDesc('total')
                ->limit(5)
                ->get();
            
            // Calculer les paiements par devise
            $paiementsUSD = Dime::whereBetween('date_versement', [$debut, $fin])
                ->where('montant_usd', '>', 0)
                ->count();
            
            $paiementsCDF = Dime::whereBetween('date_versement', [$debut, $fin])
                ->where('montant_cdf', '>', 0)
                ->count();
            
            // Membres par devise
            $membresUSD = Dime::whereBetween('date_versement', [$debut, $fin])
                ->where('montant_usd', '>', 0)
                ->distinct('membre_id')
                ->count('membre_id');
            
            $membresCDF = Dime::whereBetween('date_versement', [$debut, $fin])
                ->where('montant_cdf', '>', 0)
                ->distinct('membre_id')
                ->count('membre_id');
            
            return response()->json([
                'success' => true,
                'data' => [
                    'periode' => [
                        'debut' => $debut,
                        'fin' => $fin
                    ],
                    'totaux' => [
                        'total_usd' => (float) $totalUSD,
                        'total_cdf' => (float) $totalCDF,
                        'total_percu' => round($totalPerçuUSD, 2),
                        'total_paiements' => $totalPaiements,
                        'membres_actifs' => $membresActifs,
                        'total_membres' => $totalMembres,
                        'taux_participation' => round($tauxParticipation, 2),
                    ],
                    'details' => [
                        'usd' => [
                            'montant' => (float) $totalUSD,
                            'paiements' => $paiementsUSD,
                            'membres' => $membresUSD,
                        ],
                        'cdf' => [
                            'montant' => (float) $totalCDF,
                            'paiements' => $paiementsCDF,
                            'membres' => $membresCDF,
                        ]
                    ],
                    'par_methode' => $statsMethodes,
                    'par_mois' => $statsMois,
                    'top_contributeurs' => $topContributeurs
                ],
                'message' => 'Statistiques récupérées avec succès'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erreur DimeController@statistiques: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les dîmes récentes.
     */
    public function recentes()
    {
        try {
            $recentes = Dime::with(['membre:id,nom,prenom,postnom'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($dime) {
                    return [
                        'id' => $dime->id,
                        'montant' => (float) $dime->montant,
                        'montant_usd' => (float) $dime->montant_usd,
                        'montant_cdf' => (float) $dime->montant_cdf,
                        'devise' => $dime->devise,
                        'date_versement' => $dime->date_versement,
                        'methode_paiement' => $dime->methode_paiement,
                        'membre_id' => $dime->membre_id,
                        'membre_nom' => $dime->membre ? $dime->membre->nom_complet : 'Inconnu'
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $recentes,
                'count' => count($recentes),
                'timestamp' => now()->format('Y-m-d H:i:s')
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erreur DimeController@recentes: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [],
                'count' => 0,
                'error' => config('app.debug') ? $e->getMessage() : null,
                'timestamp' => now()->format('Y-m-d H:i:s')
            ]);
        }
    }

    /**
     * Générer un rapport d'export.
     */
    public function export(Request $request)
    {
        try {
            $debut = $request->get('debut', Carbon::now()->startOfMonth()->toDateString());
            $fin = $request->get('fin', Carbon::now()->endOfMonth()->toDateString());
            
            $dimes = Dime::with(['membre:id,nom,prenom,postnom', 'enregistreur:id,name'])
                ->whereBetween('date_versement', [$debut, $fin])
                ->orderBy('date_versement', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'periode' => "$debut au $fin",
                    'total_dimes' => count($dimes),
                    'total_montant' => $dimes->sum('montant'),
                    'total_usd' => $dimes->sum('montant_usd'),
                    'total_cdf' => $dimes->sum('montant_cdf'),
                    'dimes' => $dimes
                ],
                'message' => 'Données prêtes pour export'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erreur DimeController@export: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la préparation de l\'export: ' . $e->getMessage()
            ], 500);
        }
    }
}