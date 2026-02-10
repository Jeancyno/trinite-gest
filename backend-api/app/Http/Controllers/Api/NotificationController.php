<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    // Rôles disponibles
    const ROLE_ALL = 'all';
    const ROLE_TRESORIER = 'tresorier';
    const ROLE_PASTEUR = 'pasteur';
    const ROLE_SECRETAIRE = 'secretaire';
    const ROLE_SUPER_ADMIN = 'super_admin';
    
    /**
     * Récupérer le nombre de notifications non lues
     */
    public function unreadCount(Request $request)
    {
        Log::info('NotificationController@unreadCount appelé', [
            'user_id' => Auth::id(),
            'user_role' => Auth::user()?->role
        ]);
        
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié',
                    'count' => 0
                ], 401);
            }
            
            $userRole = $user->role;
            
            // Compter les notifications selon le rôle
            $count = Notification::where(function($query) use ($user, $userRole) {
                $query->where('role', self::ROLE_ALL)
                      ->orWhere('role', $userRole)
                      ->orWhere('user_id', $user->id);
            })
            ->where('is_read', false)
            ->count();
            
            Log::info('Nombre de notifications non lues', [
                'count' => $count,
                'user_id' => $user->id,
                'user_role' => $userRole
            ]);
            
            return response()->json([
                'success' => true,
                'count' => $count,
                'user_id' => $user->id,
                'user_role' => $userRole
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur NotificationController@unreadCount: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur',
                'count' => 0
            ], 500);
        }
    }
    
    /**
     * Récupérer les notifications
     */
    public function index(Request $request)
    {
        Log::info('NotificationController@index appelé', [
            'user_id' => Auth::id(),
            'user_role' => Auth::user()?->role,
            'params' => $request->all()
        ]);
        
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }
            
            $userRole = $user->role;
            
            $query = Notification::query();
            
            // Filtrage par rôle
            $query->where(function($q) use ($user, $userRole) {
                $q->where('role', self::ROLE_ALL)
                  ->orWhere('role', $userRole)
                  ->orWhere('user_id', $user->id);
            });
            
            // Filtrage supplémentaire pour trésorier
            if ($userRole === self::ROLE_TRESORIER) {
                $query->where(function($q) {
                    $q->where('type', 'dime')
                      ->orWhere('role', self::ROLE_TRESORIER);
                });
            }
            
            // Filtrer par type si spécifié
            if ($request->has('type') && $request->type !== 'all') {
                $query->where('type', $request->type);
            }
            
            // Filtrer par statut de lecture
            if ($request->has('read')) {
                if ($request->read === 'unread') {
                    $query->where('is_read', false);
                } elseif ($request->read === 'read') {
                    $query->where('is_read', true);
                }
            }
            
            // Recherche
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('message', 'like', "%{$search}%");
                });
            }
            
            // Trier par date (les plus récentes en premier)
            $query->orderBy('created_at', 'desc');
            
            // Pagination
            $perPage = $request->get('per_page', 15);
            $notifications = $query->paginate($perPage);
            
            // Charger les relations utilisateur
            $notifications->load('user:id,name');
            
            // Compter les non lues pour les stats
            $unreadCount = Notification::where(function($q) use ($user, $userRole) {
                $q->where('role', self::ROLE_ALL)
                  ->orWhere('role', $userRole)
                  ->orWhere('user_id', $user->id);
            })
            ->where('is_read', false)
            ->count();
            
            Log::info('Notifications récupérées', [
                'total' => $notifications->total(),
                'count' => $notifications->count(),
                'unread_count' => $unreadCount,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $notifications,
                'unread_count' => $unreadCount,
                'message' => 'Notifications récupérées avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur NotificationController@index: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);
            
            // Pour debug, retourner des données de démo
            return $this->getDemoData($user);
        }
    }
    
    /**
     * Marquer une notification comme lue
     */
    public function markAsRead($id)
    {
        Log::info('NotificationController@markAsRead appelé', [
            'notification_id' => $id,
            'user_id' => Auth::id()
        ]);
        
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }
            
            $notification = Notification::find($id);
            
            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification non trouvée'
                ], 404);
            }
            
            // Vérifier que l'utilisateur a accès à cette notification
            if (!$this->userCanAccessNotification($user, $notification)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette notification'
                ], 403);
            }
            
            $notification->update(['is_read' => true]);
            
            Log::info('Notification marquée comme lue', [
                'notification_id' => $id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Notification marquée comme lue'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur NotificationController@markAsRead: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'notification_id' => $id,
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur'
            ], 500);
        }
    }
    
    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead()
    {
        Log::info('NotificationController@markAllAsRead appelé', [
            'user_id' => Auth::id()
        ]);
        
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }
            
            $userRole = $user->role;
            
            // Récupérer les IDs des notifications accessibles
            $notificationIds = Notification::where(function($q) use ($user, $userRole) {
                $q->where('role', self::ROLE_ALL)
                  ->orWhere('role', $userRole)
                  ->orWhere('user_id', $user->id);
            })
            ->where('is_read', false)
            ->pluck('id')
            ->toArray();
            
            if (count($notificationIds) > 0) {
                Notification::whereIn('id', $notificationIds)->update(['is_read' => true]);
            }
            
            Log::info('Toutes les notifications marquées comme lues', [
                'marked_count' => count($notificationIds),
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => count($notificationIds) . ' notifications marquées comme lues',
                'marked_count' => count($notificationIds)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur NotificationController@markAllAsRead: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur'
            ], 500);
        }
    }
    
    /**
     * Supprimer une notification
     */
    public function destroy($id)
    {
        Log::info('NotificationController@destroy appelé', [
            'notification_id' => $id,
            'user_id' => Auth::id()
        ]);
        
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }
            
            $notification = Notification::find($id);
            
            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification non trouvée'
                ], 404);
            }
            
            // Vérifier les droits
            if (!$this->userCanAccessNotification($user, $notification)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ], 403);
            }
            
            $notification->delete();
            
            Log::info('Notification supprimée', [
                'notification_id' => $id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Notification supprimée avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur NotificationController@destroy: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'notification_id' => $id,
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur'
            ], 500);
        }
    }
    
    /**
     * Récupérer les notifications récentes
     */
    public function recent(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'count' => 0
                ]);
            }
            
            $userRole = $user->role;
            $limit = $request->limit ?? 5;
            
            $notifications = Notification::where(function($q) use ($user, $userRole) {
                $q->where('role', self::ROLE_ALL)
                  ->orWhere('role', $userRole)
                  ->orWhere('user_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
            
            return response()->json([
                'success' => true,
                'data' => $notifications,
                'count' => $notifications->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur NotificationController@recent: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [],
                'count' => 0
            ]);
        }
    }
    
    /**
     * Vérifier si un utilisateur peut accéder à une notification
     */
    private function userCanAccessNotification($user, $notification)
    {
        $userRole = $user->role;
        
        // Vérifier les conditions d'accès
        return $notification->role === self::ROLE_ALL ||
               $notification->role === $userRole ||
               $notification->user_id === $user->id ||
               (in_array($userRole, [self::ROLE_SUPER_ADMIN, self::ROLE_PASTEUR, self::ROLE_SECRETAIRE]) && 
                $notification->role !== self::ROLE_TRESORIER);
    }
    
    /**
     * Données de démo pour debug
     */
    private function getDemoData($user)
    {
        $userRole = $user->role;
        
        $demoData = [];
        
        if ($userRole === 'tresorier') {
            // Trésorier ne voit que les dîmes
            $demoData = [
                [
                    'id' => 1,
                    'title' => "Paiement Dîme",
                    'message' => "David Mbayo a payé 75 USD (Dîme)",
                    'type' => "dime",
                    'role' => "tresorier",
                    'is_read' => false,
                    'created_at' => now()->toISOString(),
                    'user' => ['name' => 'Admin']
                ],
                [
                    'id' => 2,
                    'title' => "Paiement Dîme",
                    'message' => "Sarah Kabasele a payé 15000 CDF (Dîme)",
                    'type' => "dime",
                    'role' => "all",
                    'is_read' => true,
                    'created_at' => now()->subHours(2)->toISOString(),
                    'user' => ['name' => 'Secrétaire']
                ]
            ];
        } else {
            // Pasteur/Admin/Secretaire voient tout
            $demoData = [
                [
                    'id' => 1,
                    'title' => "Paiement enregistré",
                    'message' => "David Mbayo a payé 75 USD (Dîme)",
                    'type' => "dime",
                    'role' => "all",
                    'is_read' => false,
                    'created_at' => now()->toISOString(),
                    'user' => ['name' => 'Admin']
                ],
                [
                    'id' => 2,
                    'title' => "Nouvel engagement",
                    'message' => "Paul Lukusa s'est engagé pour 500 USD",
                    'type' => "engagement",
                    'role' => "all",
                    'is_read' => false,
                    'created_at' => now()->subHours(1)->toISOString(),
                    'user' => ['name' => 'Secrétaire']
                ],
                [
                    'id' => 3,
                    'title' => "Nouvelle dépense",
                    'message' => "Achat matériel construction - 250 USD",
                    'type' => "expense",
                    'role' => "all",
                    'is_read' => true,
                    'created_at' => now()->subDays(1)->toISOString(),
                    'user' => ['name' => 'Trésorier']
                ],
                [
                    'id' => 4,
                    'title' => "Nouveau membre",
                    'message' => "Sophie Matadi s'est inscrite",
                    'type' => "member",
                    'role' => "all",
                    'is_read' => true,
                    'created_at' => now()->subDays(2)->toISOString(),
                    'user' => ['name' => 'Pasteur']
                ]
            ];
        }
        
        $paginatedData = [
            'current_page' => 1,
            'data' => $demoData,
            'first_page_url' => '/api/notifications?page=1',
            'from' => 1,
            'last_page' => 1,
            'last_page_url' => '/api/notifications?page=1',
            'links' => [],
            'next_page_url' => null,
            'path' => '/api/notifications',
            'per_page' => 15,
            'prev_page_url' => null,
            'to' => count($demoData),
            'total' => count($demoData)
        ];
        
        return response()->json([
            'success' => true,
            'data' => $paginatedData,
            'unread_count' => collect($demoData)->where('is_read', false)->count(),
            'message' => 'Données de démo (mode debug)'
        ]);
    }
    
    /**
     * Méthodes statiques pour créer des notifications
     */
    public static function createDimeNotification($dime, $createdBy)
    {
        try {
            $membreName = $dime->membre ? 
                $dime->membre->nom . ' ' . $dime->membre->prenom : 
                'Un membre';
            
            $message = $membreName . ' a payé ' . $dime->montant . ' ' . $dime->devise . ' (Dîme)';
            
            // Notification pour LE TRÉSORIER
            Notification::create([
                'title' => 'Nouveau paiement Dîme',
                'message' => $message,
                'type' => 'dime',
                'role' => self::ROLE_TRESORIER,
                'related_model' => 'Dime',
                'related_id' => $dime->id,
                'user_id' => $createdBy?->id ?? null,
                'data' => [
                    'membre_id' => $dime->membre_id,
                    'montant' => $dime->montant,
                    'devise' => $dime->devise,
                    'methode' => $dime->methode_paiement,
                    'date' => $dime->date_versement
                ]
            ]);
            
            // Notification pour les autres rôles
            Notification::create([
                'title' => 'Paiement enregistré',
                'message' => $message,
                'type' => 'dime',
                'role' => self::ROLE_ALL,
                'related_model' => 'Dime',
                'related_id' => $dime->id,
                'user_id' => $createdBy?->id ?? null,
                'data' => [
                    'membre_id' => $dime->membre_id,
                    'montant' => $dime->montant
                ]
            ]);
            
            Log::info('Notification de dîme créée', [
                'dime_id' => $dime->id,
                'membre_id' => $dime->membre_id
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('Erreur createDimeNotification: ' . $e->getMessage());
            return false;
        }
    }
    
    public static function createEngagementNotification($promesse, $createdBy)
    {
        try {
            $membreName = $promesse->membre ? 
                $promesse->membre->nom . ' ' . $promesse->membre->prenom : 
                'Un membre';
            
            $message = $membreName . ' s\'est engagé pour ' . 
                       $promesse->montant_total . ' ' . $promesse->devise;
            
            Notification::create([
                'title' => 'Nouvel engagement',
                'message' => $message,
                'type' => 'engagement',
                'role' => self::ROLE_ALL,
                'related_model' => 'Promesse',
                'related_id' => $promesse->id,
                'user_id' => $createdBy?->id ?? null,
                'data' => [
                    'membre_id' => $promesse->membre_id,
                    'montant_total' => $promesse->montant_total,
                    'duree' => $promesse->duree_mois . ' mois',
                    'date_debut' => $promesse->date_debut
                ]
            ]);
            
            Log::info('Notification d\'engagement créée', [
                'promesse_id' => $promesse->id,
                'membre_id' => $promesse->membre_id
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('Erreur createEngagementNotification: ' . $e->getMessage());
            return false;
        }
    }
    
    public static function createExpenseNotification($depense, $createdBy)
    {
        try {
            $message = 'Dépense: ' . $depense->motif . ' - ' . 
                       $depense->montant . ' ' . $depense->devise;
            
            Notification::create([
                'title' => 'Nouvelle dépense',
                'message' => $message,
                'type' => 'expense',
                'role' => self::ROLE_ALL,
                'related_model' => 'Depense',
                'related_id' => $depense->id,
                'user_id' => $createdBy?->id ?? null,
                'data' => [
                    'source' => $depense->source,
                    'montant' => $depense->montant,
                    'devise' => $depense->devise,
                    'date' => $depense->date_depense,
                    'details' => $depense->details
                ]
            ]);
            
            Log::info('Notification de dépense créée', [
                'depense_id' => $depense->id,
                'montant' => $depense->montant
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('Erreur createExpenseNotification: ' . $e->getMessage());
            return false;
        }
    }
}