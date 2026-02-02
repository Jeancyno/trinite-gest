<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Membre;
use App\Models\Promesse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class MembreController extends Controller
{
    /**
     * Créer un membre (version publique - sans authentification)
     */
    public function storePublic(Request $request)
    {
        try {
            Log::info('Création membre public - Données reçues:', $request->all());
            
            // Validation des données
            $validator = Validator::make($request->all(), [
                'nom' => 'required|string|max:255',
                'postnom' => 'nullable|string|max:255',
                'prenom' => 'nullable|string|max:255',
                'sexe' => 'required|in:M,F',
                'telephone' => 'required|string|max:20',
                'adresse' => 'nullable|string|max:500',
                'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ], [
                'telephone.required' => 'Le numéro de téléphone est obligatoire.',
                'photo.max' => 'La photo ne doit pas dépasser 2MB.',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation échouée:', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            // VÉRIFICATION D'UNICITÉ AVANT TOUT
            $validatedData = $validator->validated();
            
            // Normaliser le téléphone pour la vérification
            $normalizedForCheck = $this->normalizePhoneForSearch($validatedData['telephone']);
            $cleanedForCheck = preg_replace('/\D/', '', $normalizedForCheck);
            
            // Vérifier si le numéro existe déjà (format strict)
            $existingMembre = Membre::whereRaw("REPLACE(REPLACE(REPLACE(telephone, ' ', ''), '+', ''), '-', '') = ?", [$cleanedForCheck])
                ->first();
                
            if ($existingMembre) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce numéro de téléphone est déjà utilisé par un autre membre.',
                    'existing_membre' => [
                        'id' => $existingMembre->id,
                        'nom_complet' => trim($existingMembre->nom . ' ' . $existingMembre->postnom . ' ' . $existingMembre->prenom)
                    ]
                ], 422);
            }
            
            // Formatage final pour l'affichage
            $validatedData['telephone'] = $this->formatPhone($validatedData['telephone']);

            // Traitement de la photo
            if ($request->hasFile('photo')) {
                $photoPath = $request->file('photo')->store('membres/photos', 'public');
                $validatedData['photo'] = $photoPath;
            }

            // Création du membre
            $membre = Membre::create($validatedData);

            Log::info('Membre créé avec succès:', ['id' => $membre->id, 'telephone' => $membre->telephone]);

            // Ajouter l'URL de la photo pour React
            if ($membre->photo) {
                $membre->photo_url = Storage::url($membre->photo);
            }

            return response()->json([
                'success' => true,
                'message' => 'Membre créé avec succès',
                'data' => $membre
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur création membre public: ' . $e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur lors de la création du membre',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recherche publique d'un membre par téléphone - VERSION ROBUSTE
     */
    public function searchByPhonePublic($telephone)
    {
        try {
            // 1. NORMALISATION STRICTE
            $normalizedPhone = $this->normalizePhoneForSearch($telephone);
            
            if (empty($normalizedPhone) || strlen($normalizedPhone) < 10) {
                return response()->json([
                    'success' => true,
                    'exists' => false,
                    'message' => 'Numéro de téléphone invalide. Format attendu: 0XXXXXXXXX'
                ]);
            }

            // 2. RECHERCHE EXACTE - Plus de LIKE, seulement égalité
            $cleanedForSearch = preg_replace('/\D/', '', $normalizedPhone);
            
            $membre = Membre::whereRaw("REPLACE(REPLACE(REPLACE(telephone, ' ', ''), '+', ''), '-', '') = ?", [$cleanedForSearch])
                ->first();

            if (!$membre) {
                return response()->json([
                    'success' => true,
                    'exists' => false,
                    'message' => 'Aucun membre trouvé avec ce numéro'
                ]);
            }

            // Ajouter l'URL de la photo
            if ($membre->photo) {
                $membre->photo_url = Storage::url($membre->photo);
            }

            // Vérifier si le membre a des engagements en cours
            $pendingPromises = Promesse::where('membre_id', $membre->id)
                ->where('statut', 'actif')
                ->where(function($query) {
                    $query->whereNull('date_fin')
                          ->orWhere('date_fin', '>', now());
                })
                ->get()
                ->map(function ($promesse) {
                    $montantPaye = $promesse->paiements()->sum('montant');
                    return [
                        'id' => $promesse->id,
                        'montant_total' => $promesse->montant_total,
                        'devise' => $promesse->devise,
                        'montant_paye' => $montantPaye,
                        'montant_restant' => $promesse->montant_total - $montantPaye,
                        'pourcentage_paye' => $promesse->montant_total > 0 
                            ? round(($montantPaye / $promesse->montant_total) * 100, 1) 
                            : 0,
                        'date_debut' => $promesse->date_debut,
                        'date_fin' => $promesse->date_fin,
                        'statut' => $promesse->statut
                    ];
                });

            return response()->json([
                'success' => true,
                'exists' => true,
                'message' => 'Membre trouvé',
                'data' => $membre,
                'has_pending_engagements' => $pendingPromises->count() > 0,
                'pending_engagements' => $pendingPromises
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur recherche membre: ' . $e->getMessage(), [
                'telephone' => $telephone,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage (version protégée).
     */
    public function store(Request $request)
    {
        // Version protégée - même logique que publique mais avec auth
        return $this->storePublic($request);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $query = Membre::query();
            
            // Filtres
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('postnom', 'like', "%{$search}%")
                      ->orWhere('prenom', 'like', "%{$search}%")
                      ->orWhere('telephone', 'like', "%{$search}%");
                });
            }
            
            if ($request->has('sexe')) {
                $query->where('sexe', $request->sexe);
            }
            
            // Pagination
            $perPage = $request->get('per_page', 15);
            $membres = $query->orderBy('created_at', 'desc')->paginate($perPage);
            
            // Ajouter l'URL de la photo et les engagements
            $membres->getCollection()->transform(function ($membre) {
                if ($membre->photo) {
                    $membre->photo_url = Storage::url($membre->photo);
                }
                
                // Ajouter le nombre d'engagements actifs
                $membre->active_engagements_count = $membre->promesses()
                    ->where('statut', 'actif')
                    ->where(function($query) {
                        $query->whereNull('date_fin')
                              ->orWhere('date_fin', '>', now());
                    })
                    ->count();
                
                return $membre;
            });
            
            return response()->json([
                'success' => true,
                'data' => $membres
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur listing membres: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des membres'
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            $membre = Membre::with(['promesses' => function($query) {
                $query->orderBy('created_at', 'desc');
            }, 'promesses.paiements'])->findOrFail($id);
            
            // Ajouter l'URL de la photo
            if ($membre->photo) {
                $membre->photo_url = Storage::url($membre->photo);
            }
            
            // Calculer les statistiques d'engagement
            $totalEngagements = $membre->promesses()->count();
            $activeEngagements = $membre->promesses()
                ->where('statut', 'actif')
                ->where(function($query) {
                    $query->whereNull('date_fin')
                          ->orWhere('date_fin', '>', now());
                })
                ->count();
            
            $totalMontantEngage = $membre->promesses()->sum('montant_total');
            $totalMontantPaye = $membre->promesses()
                ->with('paiements')
                ->get()
                ->sum(function ($promesse) {
                    return $promesse->paiements->sum('montant');
                });
            
            $membre->engagement_stats = [
                'total_engagements' => $totalEngagements,
                'active_engagements' => $activeEngagements,
                'total_montant_engage' => $totalMontantEngage,
                'total_montant_paye' => $totalMontantPaye,
                'taux_paiement' => $totalMontantEngage > 0 
                    ? round(($totalMontantPaye / $totalMontantEngage) * 100, 2) 
                    : 0
            ];
            
            return response()->json([
                'success' => true,
                'data' => $membre
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Membre non trouvé'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $membre = Membre::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'nom' => 'sometimes|required|string|max:255',
                'postnom' => 'nullable|string|max:255',
                'prenom' => 'nullable|string|max:255',
                'sexe' => 'sometimes|required|in:M,F',
                'telephone' => 'sometimes|required|string|max:20',
                'adresse' => 'nullable|string|max:500',
                'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $data = $validator->validated();
            
            // Vérification d'unicité si le téléphone est modifié
            if (isset($data['telephone'])) {
                $normalizedForCheck = $this->normalizePhoneForSearch($data['telephone']);
                $cleanedForCheck = preg_replace('/\D/', '', $normalizedForCheck);
                
                $existingMembre = Membre::whereRaw("REPLACE(REPLACE(REPLACE(telephone, ' ', ''), '+', ''), '-', '') = ?", [$cleanedForCheck])
                    ->where('id', '!=', $id)
                    ->first();
                    
                if ($existingMembre) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ce numéro de téléphone est déjà utilisé par un autre membre.',
                        'existing_membre' => [
                            'id' => $existingMembre->id,
                            'nom_complet' => trim($existingMembre->nom . ' ' . $existingMembre->postnom . ' ' . $existingMembre->prenom)
                        ]
                    ], 422);
                }
                
                $data['telephone'] = $this->formatPhone($data['telephone']);
            }
            
            // Gestion de la photo
            if ($request->hasFile('photo')) {
                // Supprimer l'ancienne photo si elle existe
                if ($membre->photo && Storage::exists($membre->photo)) {
                    Storage::delete($membre->photo);
                }
                $data['photo'] = $request->file('photo')->store('membres/photos', 'public');
            }
            
            $membre->update($data);
            
            // Ajouter l'URL de la photo
            if ($membre->photo) {
                $membre->photo_url = Storage::url($membre->photo);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Membre mis à jour avec succès',
                'data' => $membre
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur mise à jour membre: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour'
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
   public function destroy($id)
{
    try {
        $membre = Membre::findOrFail($id);
        
        // Supprimer les promesses et paiements liés d'abord
        // (Ou assure-toi d'avoir 'onDelete('cascade')' dans tes migrations)
        $membre->promesses()->delete(); 

        if ($membre->photo && Storage::exists($membre->photo)) {
            Storage::delete($membre->photo);
        }
        
        $membre->delete();
        return response()->json(['success' => true, 'message' => 'Supprimé avec succès']);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

    /**
     * Recherche de membres (pour autocomplétion)
     */
    public function search(Request $request)
    {
        try {
            $search = $request->get('q');
            
            if (!$search || strlen($search) < 2) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }
            
            $membres = Membre::where('nom', 'like', "%{$search}%")
                ->orWhere('postnom', 'like', "%{$search}%")
                ->orWhere('prenom', 'like', "%{$search}%")
                ->orWhere('telephone', 'like', "%{$search}%")
                ->orderBy('nom')
                ->limit(20)
                ->get()
                ->map(function ($membre) {
                    return [
                        'id' => $membre->id,
                        'value' => $membre->id,
                        'label' => "{$membre->nom} {$membre->prenom} - {$membre->telephone}",
                        'nom' => $membre->nom,
                        'prenom' => $membre->prenom,
                        'telephone' => $membre->telephone
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $membres
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche'
            ], 500);
        }
    }

    /**
     * Statistiques des membres
     */
    public function stats()
    {
        try {
            $totalMembres = Membre::count();
            $hommes = Membre::where('sexe', 'M')->count();
            $femmes = Membre::where('sexe', 'F')->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $totalMembres,
                    'hommes' => $hommes,
                    'femmes' => $femmes
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur statistiques membres: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liste simple des membres (pour dropdowns)
     */
    public function list()
    {
        try {
            $membres = Membre::orderBy('nom')
                ->orderBy('prenom')
                ->get(['id', 'nom', 'postnom', 'prenom', 'telephone'])
                ->map(function ($membre) {
                    return [
                        'id' => $membre->id,
                        'label' => trim("{$membre->nom} {$membre->postnom} {$membre->prenom}") . " - {$membre->telephone}",
                        'nom_complet' => trim("{$membre->nom} {$membre->postnom} {$membre->prenom}"),
                        'telephone' => $membre->telephone
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $membres
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la liste'
            ], 500);
        }
    }

    /**
     * Formatage du numéro de téléphone pour l'affichage
     */
    private function formatPhone($phone)
    {
        if (empty($phone)) return $phone;

        // Supprimer tout ce qui n'est pas un chiffre
        $cleaned = preg_replace('/\D/', '', $phone);
        
        // Format RDC: 243...
        if (strlen($cleaned) === 12 && str_starts_with($cleaned, '243')) {
            return '+243 ' . substr($cleaned, 3, 2) . ' ' . 
                        substr($cleaned, 5, 3) . ' ' . 
                        substr($cleaned, 8, 4);
        }
        
        // Format local avec 0: 0...
        if (strlen($cleaned) === 10 && str_starts_with($cleaned, '0')) {
            return '0' . substr($cleaned, 1, 2) . ' ' . 
                    substr($cleaned, 3, 3) . ' ' . 
                    substr($cleaned, 6, 4);
        }
        
        // Format local sans 0: 8... ou 9...
        if (strlen($cleaned) === 9 && !str_starts_with($cleaned, '0')) {
            return '0' . substr($cleaned, 0, 2) . ' ' . 
                    substr($cleaned, 2, 3) . ' ' . 
                    substr($cleaned, 5, 4);
        }
        
        return $phone;
    }
    
    /**
     * NORMALISATION STRICTE pour la recherche et vérification d'unicité
     * Convertit TOUS les formats en un format unique: 0XXXXXXXXX
     */
    // private function normalizePhoneForSearch($phone)
    // {
    //     if (empty($phone)) return '';
        
    //     // Supprimer tout ce qui n'est pas un chiffre
    //     $cleaned = preg_replace('/\D/', '', $phone);
        
    //     // Si numéro commence par 243 (code RDC)
    //     if (strlen($cleaned) >= 12 && str_starts_with($cleaned, '243')) {
    //         // Garder les 10 derniers chiffres et ajouter 0 au début
    //         return '0' . substr($cleaned, -9);
    //     }
        
    //     // Si numéro a 10 chiffres et commence par 0
    //     if (strlen($cleaned) === 10 && str_starts_with($cleaned, '0')) {
    //         return $cleaned; // Déjà au bon format
    //     }
        
    //     // Si numéro a 9 chiffres (sans le 0 initial)
    //     if (strlen($cleaned) === 9) {
    //         return '0' . $cleaned;
    //     }
        
    //     // Pour les autres cas, retourner tel quel (sera rejeté plus tard)
    //     return $cleaned;
    // }

    /**
 * Normalisation STRICTE pour la recherche
 * Convertit TOUS les formats en: 0XXXXXXXXX
 */
private function normalizePhoneForSearch($phone)
{
    if (empty($phone)) return '';
    
    // Supprimer tout ce qui n'est pas un chiffre
    $cleaned = preg_replace('/\D/', '', $phone);
    
    // Cas 1: Format international +243
    if (strlen($cleaned) === 12 && str_starts_with($cleaned, '243')) {
        // +243 81 234 5678 → 0812345678
        $suffix = substr($cleaned, 3); // Enlève "243"
        // Si le suffixe commence par 81/82/83/etc., garder le 0
        return '0' . $suffix; // Résultat: 0812345678
    }
    
    // Cas 2: Format local avec 0
    if (strlen($cleaned) === 10 && str_starts_with($cleaned, '0')) {
        // 085 894 5469 → 0858945469
        return $cleaned;
    }
    
    // Cas 3: Format local sans 0 (9 chiffres)
    if (strlen($cleaned) === 9 && !str_starts_with($cleaned, '0')) {
        // 858945469 → 0858945469
        return '0' . $cleaned;
    }
    
    // Cas 4: Déjà en format 0XXXXXXXXX
    if (strlen($cleaned) === 10 && str_starts_with($cleaned, '0')) {
        return $cleaned;
    }
    
    // Pour les autres cas, retourner tel quel
    return $cleaned;
}

    /**
     * Recherche spécifique par téléphone (protégée)
     */
    public function searchByPhone(Request $request)
    {
        try {
            $request->validate([
                'telephone' => 'required|string'
            ]);
            
            $result = $this->searchByPhonePublic($request->telephone);
            
            return $result;
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche par téléphone'
            ], 500);
        }
    }

    /**
     * Rapport de présence des membres
     */
    public function presenceReport(Request $request)
    {
        try {
            $membres = Membre::with(['promesses.paiements'])->get()->map(function ($membre) {
                
                // 1. Filtrer les promesses actives
                $promessesActives = $membre->promesses->where('statut', 'actif');
                
                // 2. Calculer les montants (sécurisé en float)
                $totalEngage = (float) $promessesActives->sum('montant_total');
                
                $totalPaye = (float) $promessesActives->reduce(function ($carry, $promesse) {
                    return $carry + $promesse->paiements->sum('montant');
                }, 0);

                // 3. Sécurité anti-division par zéro pour le taux
                $taux = $totalEngage > 0 ? round(($totalPaye / $totalEngage) * 100, 1) : 0;

                return [
                    'id' => $membre->id,
                    'nom_complet' => trim("{$membre->nom} {$membre->postnom} {$membre->prenom}"),
                    'photo_url' => $membre->photo ? asset('storage/' . $membre->photo) : null,
                    'promesses_count' => $promessesActives->count(),
                    'total_engage' => $totalEngage,
                    'total_paye' => $totalPaye,
                    'taux_paiement' => $taux,
                    'sexe' => $membre->sexe
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $membres,
                'stats' => [
                    'total_membres' => $membres->count(),
                    'total_montant_engage' => (float) $membres->sum('total_engage'),
                    'total_montant_paye' => (float) $membres->sum('total_paye'),
                    'moyenne_taux_paiement' => $membres->avg('taux_paiement') ?? 0
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur API PresenceReport : ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur interne du serveur'
            ], 500);
        }
    }

    /**
     * Vérifier si un membre existe par téléphone (version publique)
     */
    public function checkExists($telephone)
    {
        try {
            // Utiliser la même normalisation
            $normalizedPhone = $this->normalizePhoneForSearch($telephone);
            $cleanedForSearch = preg_replace('/\D/', '', $normalizedPhone);
            
            $membre = Membre::whereRaw("REPLACE(REPLACE(REPLACE(telephone, ' ', ''), '+', ''), '-', '') = ?", [$cleanedForSearch])
                ->first();

            if ($membre) {
                // Vérifier les engagements en cours
                $pendingPromises = Promesse::where('membre_id', $membre->id)
                    ->where('statut', 'actif')
                    ->where(function($query) {
                        $query->whereNull('date_fin')
                            ->orWhere('date_fin', '>', now());
                    })
                    ->first();

                $hasPending = $pendingPromises ? true : false;
                
                if ($pendingPromises) {
                    $montantPaye = $pendingPromises->paiements()->sum('montant');
                }

                return response()->json([
                    'success' => true,
                    'exists' => true,
                    'has_pending' => $hasPending,
                    'membre_id' => $membre->id,
                    'membre_nom' => $membre->nom . ' ' . $membre->prenom,
                    'pending_data' => $hasPending ? [
                        'id' => $pendingPromises->id,
                        'montant_total' => $pendingPromises->montant_total,
                        'devise' => $pendingPromises->devise,
                        'montant_paye' => $montantPaye,
                        'montant_restant' => $pendingPromises->montant_total - $montantPaye,
                        'pourcentage_paye' => $pendingPromises->montant_total > 0 
                            ? round(($montantPaye / $pendingPromises->montant_total) * 100, 1) 
                            : 0,
                    ] : null
                ]);
            }

            return response()->json([
                'success' => true,
                'exists' => false,
                'has_pending' => false
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification'
            ], 500);
        }
    }

    // /**
    //  * Nettoyage des doublons dans la base de données
    //  * À exécuter une seule fois via une route API sécurisée
    //  */
    // public function cleanDuplicatePhones()
    // {
    //     try {
    //         Log::info('Début du nettoyage des doublons de numéros');
            
    //         // Trouver tous les numéros dupliqués
    //         $duplicates = DB::table('membres')
    //             ->select(DB::raw('REPLACE(REPLACE(REPLACE(telephone, " ", ""), "+", ""), "-", "") as clean_phone, COUNT(*) as count'))
    //             ->groupBy('clean_phone')
    //             ->having('count', '>', 1)
    //             ->get();
            
    //         $corrections = [];
            
    //         foreach ($duplicates as $duplicate) {
    //             Log::info('Traitement dupliqué: ' . $duplicate->clean_phone . ' (' . $duplicate->count . ' occurences)');
                
    //             // Trouver les membres avec ce numéro
    //             $membres = Membre::whereRaw("REPLACE(REPLACE(REPLACE(telephone, ' ', ''), '+', ''), '-', '') = ?", [$duplicate->clean_phone])
    //                 ->orderBy('created_at', 'asc')
    //                 ->get();
                
    //             // Garder le premier (le plus ancien)
    //             $firstMembre = $membres->first();
                
    //             // Normaliser le numéro du premier membre
    //             $normalizedPhone = $this->normalizePhoneForSearch($firstMembre->telephone);
    //             $formattedPhone = $this->formatPhone($normalizedPhone);
                
    //             // Mettre à jour le premier membre avec le format normalisé
    //             $firstMembre->update(['telephone' => $formattedPhone]);
                
    //             // Marquer les autres comme doublons
    //             for ($i = 1; $i < count($membres); $i++) {
    //                 $timestamp = time() . '_' . $i;
    //                 $newPhone = $membres[$i]->telephone . '_DUPLICATE_' . $timestamp;
                    
    //                 $membres[$i]->update(['telephone' => $newPhone]);
                    
    //                 $corrections[] = [
    //                     'ancien_id' => $membres[$i]->id,
    //                     'ancien_numero' => $membres[$i]->telephone,
    //                     'nouveau_numero' => $newPhone,
    //                     'membre_conserve' => $firstMembre->id,
    //                     'nom_conserve' => $firstMembre->nom . ' ' . $firstMembre->prenom
    //                 ];
                    
    //                 Log::info('Numéro marqué comme doublon: ID ' . $membres[$i]->id . ' -> ' . $newPhone);
    //             }
    //         }
            
    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Nettoyage des doublons terminé',
    //             'corrections_apportees' => count($corrections),
    //             'details' => $corrections
    //         ]);
            
    //     } catch (\Exception $e) {
    //         Log::error('Erreur lors du nettoyage des doublons: ' . $e->getMessage());
            
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Erreur lors du nettoyage: ' . $e->getMessage()
    //         ], 500);
    //     }
    // }

    /**
     * Valider un numéro de téléphone avant saisie
     * Utile pour le frontend
     */
    public function validatePhoneFormat(Request $request)
    {
        try {
            $request->validate([
                'telephone' => 'required|string'
            ]);
            
            $phone = $request->telephone;
            $normalized = $this->normalizePhoneForSearch($phone);
            $cleaned = preg_replace('/\D/', '', $normalized);
            
            $isValid = (strlen($cleaned) === 10 && str_starts_with($cleaned, '0'));
            
            return response()->json([
                'success' => true,
                'is_valid' => $isValid,
                'normalized' => $normalized,
                'suggested_format' => $isValid ? $this->formatPhone($normalized) : null,
                'message' => $isValid ? 'Format valide' : 'Format invalide. Utilisez: 0XXXXXXXXX'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation'
            ], 500);
        }
    }

public function getEtatEngagements()
{
    try {
        // Récupérer uniquement les membres qui ont des promesses actives
        $membres = Membre::whereHas('promesses', function ($query) {
            $query->where('statut', 'actif');
        })->with(['promesses' => function ($query) {
            $query->where('statut', 'actif')
                  ->with('paiements');
        }])->get();

        $finalises = [];
        $enAttente = [];
        $nonPayes = [];

        foreach ($membres as $membre) {
            foreach ($membre->promesses as $promesse) {
                // Utiliser les accesseurs du modèle
                $totalPromis = (float) $promesse->montant_total;
                $totalVerse = (float) $promesse->totalPaid(); // Cette méthode existe maintenant
                $restant = $totalPromis - $totalVerse;
                
                // Calculer le pourcentage de paiement
                $pourcentage = $totalPromis > 0 ? round(($totalVerse / $totalPromis) * 100, 1) : 0;

                $data = [
                    'membre_id' => $membre->id,
                    'promesse_id' => $promesse->id,
                    'nom_complet' => trim("{$membre->nom} {$membre->postnom} {$membre->prenom}"),
                    'telephone' => $membre->telephone,
                    'montant_promis' => $totalPromis,
                    'montant_paye' => $totalVerse,
                    'montant_restant' => $restant,
                    'pourcentage_paye' => $pourcentage,
                    'devise' => $promesse->devise,
                    'date_engagement' => $promesse->created_at->format('d/m/Y'),
                    'date_fin' => $promesse->date_fin ? date('d/m/Y', strtotime($promesse->date_fin)) : null
                ];

                if ($totalVerse <= 0) {
                    // RIEN VERSÉ
                    $nonPayes[] = $data;
                } elseif ($restant <= 0) {
                    // FINALISÉS
                    $finalises[] = $data;
                } else {
                    // EN ATTENTE (Dettes)
                    $enAttente[] = $data;
                }
            }
        }

        // Calculer les totaux
        $stats = [
            'total_membres' => count(array_unique(array_merge(
                array_column($finalises, 'membre_id'),
                array_column($enAttente, 'membre_id'),
                array_column($nonPayes, 'membre_id')
            ))),
            'total_promesses' => count($finalises) + count($enAttente) + count($nonPayes),
            'total_montant_promis' => array_sum(array_column($finalises, 'montant_promis')) +
                                     array_sum(array_column($enAttente, 'montant_promis')) +
                                     array_sum(array_column($nonPayes, 'montant_promis')),
            'total_montant_paye' => array_sum(array_column($finalises, 'montant_paye')) +
                                   array_sum(array_column($enAttente, 'montant_paye')),
            'total_montant_restant' => array_sum(array_column($enAttente, 'montant_restant')) +
                                      array_sum(array_column($nonPayes, 'montant_promis'))
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'finalises' => $finalises,
                'en_attente' => $enAttente,
                'non_payes' => $nonPayes,
                'statistiques' => $stats
            ]
        ]);

    } catch (\Exception $e) {
        \Log::error('Erreur état engagements: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors du calcul des engagements: ' . $e->getMessage()
        ], 500);
    }
}
}