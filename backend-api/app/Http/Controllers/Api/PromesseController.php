<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promesse;
use App\Models\Membre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\NotificationController;

class PromesseController extends Controller
{
    /**
     * Logique réutilisable pour vérifier si un membre est réellement bloqué
     */
    private function getActiveDebt($membreId)
    {
        // On cherche un engagement "actif"
        $engagements = Promesse::where('membre_id', $membreId)
            ->where('statut', 'actif')
            ->get();

        foreach ($engagements as $eng) {
            $totalPaye = $eng->paiements()->sum('montant');
            // Si le montant total n'est pas encore atteint, il y a une dette
            if ($totalPaye < $eng->montant_total) {
                return [
                    'engagement' => $eng,
                    'montant_paye' => $totalPaye,
                    'montant_restant' => $eng->montant_total - $totalPaye
                ];
            }
        }
        return null;
    }

    /**
     * Créer un engagement (version publique)
     */
    public function storePublic(Request $request)
    {
        Log::info('🟢 storePublic appelé', $request->all());
        
        try {
            $validator = Validator::make($request->all(), [
                'membre_id' => 'required|exists:membres,id',
                'montant_total' => 'required|numeric|min:5',
                'devise' => 'required|in:USD,CDF,EUR',
                'duree_mois' => 'required|integer|min:1|max:36',
                'date_debut' => 'required|date',
                'observation' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $validated = $validator->validated();

            // VÉRIFICATION DE LA DETTE RÉELLE
            $debt = $this->getActiveDebt($validated['membre_id']);
            if ($debt) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible : ce membre a un engagement en cours avec un solde restant de " . $debt['montant_restant'] . " " . $debt['engagement']->devise
                ], 422);
            }

            $dateDebut = Carbon::parse($validated['date_debut']);
            $dateFin = $dateDebut->copy()->addMonths($validated['duree_mois']);

            $promesse = Promesse::create([
                'membre_id' => $validated['membre_id'],
                'montant_total' => $validated['montant_total'],
                'devise' => $validated['devise'],
                'duree_mois' => $validated['duree_mois'],
                'date_debut' => $validated['date_debut'],
                'date_fin' => $dateFin->format('Y-m-d'),
                'observation' => $validated['observation'] ?? null,
                'statut' => 'actif',
            ]);

            // 🔥 CORRECTION : Créer une notification d'ENGAGEMENT (pas de dîme)
            if ($promesse) {
                // Récupérer l'utilisateur connecté
                $user = auth()->user();
                
                // Appeler la méthode de création de notification d'engagement
                // Note: Assurez-vous que NotificationController existe
                \App\Http\Controllers\Api\NotificationController::createEngagementNotification(
                    $promesse, 
                    $user
                );
            }

            return response()->json([
                'success' => true, 
                'message' => 'Engagement créé !', 
                'data' => $promesse
            ], 201);

        } catch (\Exception $e) {
            Log::error('🔥 Erreur storePublic: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Erreur serveur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier par téléphone si un membre peut créer un nouvel engagement
     */
    public function checkPendingPublic($telephone)
    {
        try {
            $cleanedPhone = preg_replace('/\D/', '', $telephone);
            
            $membre = Membre::whereRaw("REPLACE(REPLACE(REPLACE(telephone, ' ', ''), '+', ''), '-', '') LIKE ?", ['%' . $cleanedPhone . '%'])
                ->first();

            if (!$membre) {
                return response()->json([
                    'success' => true, 
                    'has_pending' => false, 
                    'membre_exists' => false
                ]);
            }

            // ON VÉRIFIE S'IL Y A UNE DETTE
            $debt = $this->getActiveDebt($membre->id);

            if ($debt) {
                $pending = $debt['engagement'];
                return response()->json([
                    'success' => true,
                    'has_pending' => true, // BLOQUÉ car solde > 0
                    'membre_exists' => true,
                    'membre_id' => $membre->id,
                    'membre_nom' => $membre->nom . ' ' . $membre->prenom,
                    'data' => [
                        'id' => $pending->id,
                        'montant_total' => $pending->montant_total,
                        'devise' => $pending->devise,
                        'montant_paye' => $debt['montant_paye'],
                        'montant_restant' => $debt['montant_restant'],
                        'pourcentage_paye' => round(($debt['montant_paye'] / $pending->montant_total) * 100, 1),
                        'statut' => $pending->statut
                    ]
                ]);
            }

            // SI PAS DE DETTE TROUVÉE
            return response()->json([
                'success' => true,
                'has_pending' => false, // LIBRE d'en créer un nouveau
                'membre_exists' => true,
                'membre_id' => $membre->id,
                'membre_nom' => $membre->nom . ' ' . $membre->prenom,
                'message' => 'Prêt pour un nouvel engagement'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $query = Promesse::with('membre');
            
            if ($request->membre_id) {
                $query->where('membre_id', $request->membre_id);
            }
            
            if ($request->statut) {
                $query->where('statut', $request->statut);
            }
            
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->whereHas('membre', function($q2) use ($search) {
                        $q2->where('nom', 'like', "%{$search}%")
                           ->orWhere('prenom', 'like', "%{$search}%")
                           ->orWhere('postnom', 'like', "%{$search}%");
                    })
                    ->orWhere('observation', 'like', "%{$search}%")
                    ->orWhere('devise', 'like', "%{$search}%");
                });
            }

            $promesses = $query->orderBy('created_at', 'desc')
                              ->paginate($request->per_page ?? 15);

            // Ajouter les montants payés et restants
            $promesses->getCollection()->transform(function ($p) {
                $paye = $p->paiements()->sum('montant');
                $p->montant_paye = $paye;
                $p->montant_restant = $p->montant_total - $paye;
                $p->pourcentage_paye = $p->montant_total > 0 ? 
                    round(($paye / $p->montant_total) * 100, 2) : 0;
                return $p;
            });

            return response()->json([
                'success' => true, 
                'data' => $promesses,
                'message' => 'Liste des engagements récupérée'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur PromesseController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Erreur serveur'
            ], 500);
        }
    }

    public function show(Promesse $promesse)
    {
        try {
            $paye = $promesse->paiements()->sum('montant');
            
            return response()->json([
                'success' => true,
                'data' => [
                    'promesse' => $promesse->load('membre', 'paiements'),
                    'montant_paye' => $paye,
                    'montant_restant' => $promesse->montant_total - $paye,
                    'pourcentage_paye' => $promesse->montant_total > 0 ? 
                        round(($paye / $promesse->montant_total) * 100, 2) : 0
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur PromesseController@show: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Erreur serveur'
            ], 500);
        }
    }

    public function update(Request $request, Promesse $promesse)
    {
        try {
            $validator = Validator::make($request->all(), [
                'montant_total' => 'sometimes|numeric|min:1',
                'statut' => 'sometimes|in:actif,termine,annule',
                'observation' => 'nullable|string',
                'devise' => 'sometimes|in:USD,CDF,EUR',
                'date_debut' => 'sometimes|date',
                'date_fin' => 'sometimes|date|after:date_debut'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false, 
                    'errors' => $validator->errors()
                ], 422);
            }

            $promesse->update($validator->validated());
            
            return response()->json([
                'success' => true, 
                'data' => $promesse,
                'message' => 'Engagement mis à jour'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur PromesseController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Erreur serveur'
            ], 500);
        }
    }

    public function destroy(Promesse $promesse)
    {
        try {
            if ($promesse->paiements()->count() > 0) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Impossible de supprimer : des paiements sont associés à cet engagement'
                ], 422);
            }
            
            $promesse->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Engagement supprimé avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur PromesseController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Erreur serveur'
            ], 500);
        }
    }

    public function stats()
    {
        try {
            $stats = [
                'total' => Promesse::count(),
                'actives' => Promesse::where('statut', 'actif')->count(),
                'termines' => Promesse::where('statut', 'termine')->count(),
                'annules' => Promesse::where('statut', 'annule')->count(),
                'montant_total' => (float) Promesse::sum('montant_total'),
                'montant_actif' => (float) Promesse::where('statut', 'actif')->sum('montant_total'),
                'par_devise' => Promesse::select('devise', DB::raw('COUNT(*) as count'), DB::raw('SUM(montant_total) as total'))
                    ->groupBy('devise')
                    ->get()
            ];
            
            return response()->json([
                'success' => true, 
                'data' => $stats
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur PromesseController@stats: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Erreur serveur'
            ], 500);
        }
    }
    
    /**
     * Créer un paiement sur un engagement
     */
    public function storePaiement(Request $request, Promesse $promesse)
    {
        try {
            $validator = Validator::make($request->all(), [
                'montant' => 'required|numeric|min:1',
                'devise' => 'required|in:USD,CDF,EUR',
                'date_paiement' => 'required|date',
                'methode_paiement' => 'required|in:Espèces,Mobile Money,Banque,Virement,Carte de crédit,Chèque,Autre',
                'note' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false, 
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();
            
            // Vérifier que le montant ne dépasse pas le restant
            $totalPaye = $promesse->paiements()->sum('montant');
            $montantRestant = $promesse->montant_total - $totalPaye;
            
            if ($validated['montant'] > $montantRestant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le montant dépasse le solde restant (' . $montantRestant . ' ' . $promesse->devise . ')'
                ], 422);
            }

            $paiement = $promesse->paiements()->create([
                'montant' => $validated['montant'],
                'devise' => $validated['devise'],
                'date_paiement' => $validated['date_paiement'],
                'methode_paiement' => $validated['methode_paiement'],
                'note' => $validated['note'] ?? null,
                'user_id' => auth()->id()
            ]);
            
            // Mettre à jour le statut si entièrement payé
            $nouveauTotalPaye = $totalPaye + $validated['montant'];
            if (abs($nouveauTotalPaye - $promesse->montant_total) < 0.01) {
                $promesse->update(['statut' => 'termine']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Paiement enregistré',
                'data' => $paiement
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Erreur PromesseController@storePaiement: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Erreur serveur'
            ], 500);
        }
    }
}