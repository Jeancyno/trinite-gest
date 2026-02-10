<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'role', // 'all', 'pasteur', 'tresorier', 'secretaire', 'super_admin'
        'title',
        'message',
        'type', // 'dime', 'engagement', 'member', 'expense', 'warning', 'info'
        'related_model',
        'related_id',
        'is_read',
        'data'
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean'
    ];

    /**
     * Récupérer les notifications selon le rôle de l'utilisateur
     */
    public static function getForUser($user)
    {
        $userRole = $user->role; // Le rôle de l'utilisateur connecté
        
        return self::where(function($query) use ($user, $userRole) {
            // 1. Notifications pour TOUS les rôles
            $query->where('role', 'all');
            
            // 2. Notifications spécifiques au RÔLE de l'utilisateur
            $query->orWhere('role', $userRole);
            
            // 3. Notifications spécifiques à l'UTILISATEUR (si besoin)
            $query->orWhere('user_id', $user->id);
            
            // 4. Logique spéciale selon le rôle
            if (in_array($userRole, ['super_admin', 'pasteur', 'secretaire'])) {
                // Voir toutes les notifications sauf celles spécifiques au trésorier
                $query->orWhere(function($q) {
                    $q->where('role', '!=', 'tresorier')
                      ->whereNull('user_id');
                });
            }
            
            // 5. Filtre strict pour le trésorier
            if ($userRole === 'tresorier') {
                $query->where(function($q) {
                    // Trésorier ne voit QUE les dîmes
                    $q->where('type', 'dime')
                      ->orWhere('role', 'tresorier');
                });
            }
        })
        ->orderBy('created_at', 'desc')
        ->get();
    }

    // Relation avec l'utilisateur
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes utiles
    public function scopeForRole($query, $role)
    {
        return $query->where(function($q) use ($role) {
            $q->where('role', 'all')
              ->orWhere('role', $role);
        });
    }

    public function scopeForTreasurer($query)
    {
        return $query->where(function($q) {
            $q->where('role', 'all')
              ->orWhere('role', 'tresorier')
              ->orWhere('type', 'dime');
        });
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }
}