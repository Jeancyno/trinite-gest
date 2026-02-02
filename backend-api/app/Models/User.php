<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // 1. AJOUT INDISPENSABLE

class User extends Authenticatable
{
    // On ajoute HasApiTokens ici
    
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Les attributs assignables en masse.
     */
    protected $fillable = [
        'name',
        'username', // 2. REMPLACER email PAR username
        'password',
        'role',     // 3. AJOUTER role
    ];

    /**
     * Les attributs cachés lors de la transformation en JSON (pour l'API).
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casts pour le hachage automatique du mot de passe.
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    // --- RELATIONS ---

    /**
     * Les paiements que cet utilisateur (secrétaire) a enregistrés.
     */
    public function paiementsPercus()
    {
        // On précise bien la clé étrangère 'perçu_par' créée dans la migration
        return $this->hasMany(Paiement::class, 'perçu_par');
    }

    /**
     * Les actions effectuées par cet utilisateur pour le suivi (Audit).
     */
    public function logs()
    {
        return $this->hasMany(AuditLog::class);
    }
    
    public function profile()
{
    return $this->hasOne(Profile::class);
}

/**
 * Récupérer l'URL de l'avatar.
 */
public function getAvatarUrlAttribute()
{
    return $this->profile ? $this->profile->getAvatarUrl() : asset('images/default-avatar.png');
}
}




