<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Promesse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PaiementController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Paiement::with(['promesse.membre', 'membre']);

            if ($request->has('promesse_id')) {
                $query->where('promesse_id', $request->promesse_id);
            }

            if ($request->has('membre_id')) {
                $query->where('membre_id', $request->membre_id);
            }

            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            if ($request->has('statut')) {
                $query->where('statut', $request->statut);
            }

            if ($request->has('date_from') && $request->has('date_to')) {
                $query->whereBetween('date_paiement', [
                    $request->date_from,
                    $request->date_to
                ]);
            }

            $paiements = $query->orderBy('date_paiement', 'desc')->paginate(
                $request->get('per_page', 15)
            );

            return response()->json([
                'success' => true,
                'data' => $paiements
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur chargement paiements: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur chargement paiements'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        
        try {
            Log::info('🟢 Début enregistrement paiement', $request->all());
            
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:engagement,dime',
                'membre_id' => 'required|exists:membres,id',
                'promesse_id' => 'nullable|required_if:type,engagement|exists:promesses,id',
                'montant' => 'required|numeric|min:0.01',
                'methode_paiement' => 'required|in:cash,mobile_money,carte,virement,especes',
                'date_paiement' => 'required|date|before_or_equal:today',
                'statut' => 'required|in:en_attente,complete,echoue',
                'observation' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                Log::warning('❌ Validation échouée', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();
            Log::info('✅ Données validées:', $validated);

            /* ===============================
               CAS ENGAGEMENT - Validation spécifique
            =============================== */
            $promesse = null;
            $totalDejaPaye = 0;

            if ($validated['type'] === 'engagement') {
                // Vérifier que promesse_id est présent
                if (empty($validated['promesse_id'])) {
                    Log::warning('❌ promesse_id manquant pour engagement');
                    return response()->json([
                        'success' => false,
                        'message' => 'promesse_id est requis pour un paiement d\'engagement'
                    ], 422);
                }

                $promesse = Promesse::find($validated['promesse_id']);
                
                if (!$promesse) {
                    Log::warning('❌ Promesse non trouvée:', ['promesse_id' => $validated['promesse_id']]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Engagement non trouvé'
                    ], 404);
                }

                // Vérifier que le membre correspond à la promesse
                if ($promesse->membre_id != $validated['membre_id']) {
                    Log::warning('❌ Incohérence membre/promesse:', [
                        'membre_id_request' => $validated['membre_id'],
                        'membre_id_promesse' => $promesse->membre_id
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Le membre ne correspond pas à cet engagement'
                    ], 422);
                }

                // Vérifier que la promesse est active
                if ($promesse->statut !== 'actif') {
                    Log::warning('❌ Promesse non active:', ['statut' => $promesse->statut]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Cet engagement n\'est plus actif'
                    ], 422);
                }

                // Calculer le reste à payer
                $totalDejaPaye = $promesse->paiements()->sum('montant');
                $reste = $promesse->montant_total - $totalDejaPaye;

                if ($validated['montant'] > $reste) {
                    Log::warning('❌ Montant dépasse le reste', [
                        'montant' => $validated['montant'],
                        'reste' => $reste
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => "Montant dépasse le reste dû ($reste)"
                    ], 422);
                }
            }

            /* ===============================
               ENREGISTREMENT PAIEMENT
            =============================== */
            Log::info('📝 Création paiement...');
            
            // Pour les dîmes, promesse_id sera null
            $paiementData = [
                'type' => $validated['type'],
                'membre_id' => $validated['membre_id'],
                'promesse_id' => $validated['type'] === 'engagement' ? $validated['promesse_id'] : null,
                'montant' => $validated['montant'],
                'methode_paiement' => $validated['methode_paiement'],
                'date_paiement' => $validated['date_paiement'],
                'statut' => $validated['statut'],
                'observation' => $validated['observation'] ?? (
                    $validated['type'] === 'engagement' 
                    ? "Paiement engagement #{$validated['promesse_id']}" 
                    : "Paiement dîme - " . date('F Y')
                ),
            ];

            $paiement = Paiement::create($paiementData);
            Log::info('✅ Paiement créé:', [
                'id' => $paiement->id,
                'type' => $paiement->type,
                'membre_id' => $paiement->membre_id,
                'montant' => $paiement->montant
            ]);

            /* ===============================
               MISE À JOUR ENGAGEMENT
            =============================== */
            if ($validated['type'] === 'engagement' && $promesse) {
                $nouveauTotal = $totalDejaPaye + $validated['montant'];
                Log::info('📊 Calcul nouveau total engagement:', [
                    'promesse_id' => $promesse->id,
                    'ancien_total_paye' => $totalDejaPaye,
                    'ajout' => $validated['montant'],
                    'nouveau_total_paye' => $nouveauTotal,
                    'montant_total_promesse' => $promesse->montant_total
                ]);

                if ($nouveauTotal >= $promesse->montant_total) {
                    $promesse->update([
                        'statut' => 'termine',
                        'date_fin' => now(),
                        'updated_at' => now()
                    ]);
                    Log::info('🎉 Promesse terminée:', ['promesse_id' => $promesse->id]);
                }
            }

            DB::commit();
            Log::info('✅ Transaction commitée avec succès');

            return response()->json([
                'success' => true,
                'message' => 'Paiement enregistré avec succès',
                'data' => $paiement->load(['membre', 'promesse'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('🔥 Erreur enregistrement paiement:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur lors de l\'enregistrement',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $paiement = Paiement::with(['promesse.membre', 'membre'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $paiement
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur chargement paiement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Paiement non trouvé'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $paiement = Paiement::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'montant' => 'sometimes|required|numeric|min:0.01',
                'methode_paiement' => 'sometimes|required|in:cash,mobile_money,carte,virement,especes',
                'date_paiement' => 'sometimes|required|date',
                'statut' => 'sometimes|required|in:en_attente,complete,echoue',
                'observation' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $paiement->update($validator->validated());

            Log::info('Paiement mis à jour:', ['id' => $paiement->id]);

            return response()->json([
                'success' => true,
                'message' => 'Paiement mis à jour',
                'data' => $paiement
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur mise à jour paiement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur mise à jour'
            ], 500);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        
        try {
            $paiement = Paiement::findOrFail($id);
            
            // Si c'est un paiement d'engagement, vérifier avant suppression
            if ($paiement->type === 'engagement' && $paiement->promesse_id) {
                $promesse = Promesse::find($paiement->promesse_id);
                if ($promesse && $promesse->statut === 'termine') {
                    // Recalculer le statut si nécessaire
                    $totalPaye = $promesse->paiements()->sum('montant') - $paiement->montant;
                    if ($totalPaye < $promesse->montant_total) {
                        $promesse->update([
                            'statut' => 'actif',
                            'updated_at' => now()
                        ]);
                    }
                }
            }
            
            $paiement->delete();
            
            DB::commit();
            Log::info('Paiement supprimé:', ['id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Paiement supprimé'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur suppression paiement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur suppression'
            ], 500);
        }
    }

    public function stats()
    {
        try {
            $totalPaiements = Paiement::count();
            $totalMontant = Paiement::sum('montant');

            $parType = Paiement::selectRaw('
                type,
                COUNT(*) as total,
                SUM(montant) as montant_total
            ')
            ->groupBy('type')
            ->get();

            $parMethode = Paiement::selectRaw('
                methode_paiement,
                COUNT(*) as total,
                SUM(montant) as montant_total
            ')
            ->groupBy('methode_paiement')
            ->get();

            // Statistiques par mois (6 derniers mois)
            $sixMois = now()->subMonths(6);
            $parMois = Paiement::where('date_paiement', '>=', $sixMois)
                ->selectRaw('
                    DATE_FORMAT(date_paiement, "%Y-%m") as mois,
                    COUNT(*) as total,
                    SUM(montant) as montant_total
                ')
                ->groupBy('mois')
                ->orderBy('mois')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_paiements' => $totalPaiements,
                    'total_montant' => (float) $totalMontant,
                    'par_type' => $parType,
                    'par_methode' => $parMethode,
                    'par_mois' => $parMois,
                    'moyenne' => $totalPaiements > 0 
                        ? round($totalMontant / $totalPaiements, 2)
                        : 0
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur statistiques paiements: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur statistiques'
            ], 500);
        }
    }

    /**
     * Récupérer les paiements d'un membre
     */
    public function getByMember($membreId)
    {
        try {
            $paiements = Paiement::where('membre_id', $membreId)
                ->with(['promesse'])
                ->orderBy('date_paiement', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $paiements
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur paiements par membre: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur chargement'
            ], 500);
        }
    }

    /**
     * Récupérer les paiements d'une promesse
     */
    public function getByPromesse($promesseId)
    {
        try {
            $paiements = Paiement::where('promesse_id', $promesseId)
                ->orderBy('date_paiement', 'desc')
                ->get();

            $totalPaye = $paiements->sum('montant');

            return response()->json([
                'success' => true,
                'data' => $paiements,
                'total_paye' => $totalPaye
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur paiements par promesse: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur chargement'
            ], 500);
        }
    }
    public function enregistrerPublic(Request $request)
    {
        DB::beginTransaction();
        
        try {
            Log::info('🟢 Paiement public - Données reçues:', $request->all());
            
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:engagement,dime',
                'membre_id' => 'required|exists:membres,id',
                'promesse_id' => 'nullable|required_if:type,engagement|exists:promesses,id',
                'montant' => 'required|numeric|min:0.01',
                'methode_paiement' => 'required|in:cash,mobile_money,carte,virement,especes',
                'date_paiement' => 'required|date|before_or_equal:today',
                'statut' => 'required|in:en_attente,complete,echoue',
                'observation' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                Log::warning('❌ Validation échouée paiement public', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();
            
            // Pour les paiements publics, forcer le statut à "complete"
            $validated['statut'] = 'complete';
            
            // Ajouter une note pour indiquer que c'est un paiement public
            if (empty($validated['observation'])) {
                $validated['observation'] = 'Paiement public - ' . ($validated['type'] === 'engagement' ? 
                    "Engagement #{$validated['promesse_id']}" : 
                    'Dîme - ' . date('F Y'));
            }

            Log::info('✅ Validation réussie paiement public:', $validated);

            /* ===============================
               CAS ENGAGEMENT - Validation
            =============================== */
            $promesse = null;
            $totalDejaPaye = 0;

            if ($validated['type'] === 'engagement') {
                if (empty($validated['promesse_id'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'promesse_id est requis pour un paiement d\'engagement'
                    ], 422);
                }

                $promesse = Promesse::find($validated['promesse_id']);
                
                if (!$promesse) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Engagement non trouvé'
                    ], 404);
                }

                // Vérifier que le membre correspond à la promesse
                if ($promesse->membre_id != $validated['membre_id']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Le membre ne correspond pas à cet engagement'
                    ], 422);
                }

                // Vérifier que la promesse est active
                if ($promesse->statut !== 'actif') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cet engagement n\'est plus actif'
                    ], 422);
                }

                // Calculer le reste à payer
                $totalDejaPaye = $promesse->paiements()->sum('montant');
                $reste = $promesse->montant_total - $totalDejaPaye;

                if ($validated['montant'] > $reste) {
                    return response()->json([
                        'success' => false,
                        'message' => "Montant dépasse le reste dû ($reste)"
                    ], 422);
                }
            }

            /* ===============================
               ENREGISTREMENT PAIEMENT
            =============================== */
            $paiementData = [
                'type' => $validated['type'],
                'membre_id' => $validated['membre_id'],
                'promesse_id' => $validated['type'] === 'engagement' ? $validated['promesse_id'] : null,
                'montant' => $validated['montant'],
                'methode_paiement' => $validated['methode_paiement'],
                'date_paiement' => $validated['date_paiement'],
                'statut' => $validated['statut'],
                'observation' => $validated['observation'],
            ];

            $paiement = Paiement::create($paiementData);
            Log::info('✅ Paiement public créé:', ['id' => $paiement->id]);

            /* ===============================
               MISE À JOUR ENGAGEMENT
            =============================== */
            if ($validated['type'] === 'engagement' && $promesse) {
                $nouveauTotal = $totalDejaPaye + $validated['montant'];

                if ($nouveauTotal >= $promesse->montant_total) {
                    $promesse->update([
                        'statut' => 'termine',
                        'date_fin' => now()
                    ]);
                    Log::info('🎉 Promesse terminée via paiement public:', ['promesse_id' => $promesse->id]);
                }
            }

            DB::commit();
            Log::info('✅ Transaction paiement public commitée');

            return response()->json([
                'success' => true,
                'message' => 'Paiement enregistré avec succès',
                'data' => $paiement
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('🔥 Erreur enregistrement paiement public: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur lors de l\'enregistrement',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

}