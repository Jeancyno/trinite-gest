<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Membre extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'postnom',
        'prenom',
        'sexe',
        'telephone',
        'adresse',
        'photo',
        'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['photo_url'];

    /**
     * Get the photo URL.
     */
    public function getPhotoUrlAttribute()
    {
        if ($this->photo) {
            return asset('storage/' . $this->photo);
        }
        return null;
    }

    /**
     * Get the promesses for the membre.
     */
    public function promesses(): HasMany
    {
        return $this->hasMany(Promesse::class);
    }

    /**
     * Get the paiements for the membre.
     */
    public function paiements()
    {
        return $this->hasManyThrough(Paiement::class, Promesse::class);
    }

    /**
     * Get the membre's full name.
     */
    public function getNomCompletAttribute()
    {
        return trim("{$this->nom} {$this->postnom} {$this->prenom}");
    }

    /**
     * Check if membre has active promesses.
     */
    public function hasActivePromesses()
    {
        return $this->promesses()
            ->where('statut', 'actif')
            ->where(function($query) {
                $query->whereNull('date_fin')
                      ->orWhere('date_fin', '>', now());
            })
            ->exists();
    }
}