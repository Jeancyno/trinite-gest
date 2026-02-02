<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'membre_id',
        'promesse_id',
        'montant',
        'methode_paiement',
        'date_paiement',
        'statut',
        'observation'
    ];

    protected $casts = [
        'date_paiement' => 'date',
        'montant' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Relation avec le membre
     */
    public function membre()
    {
        return $this->belongsTo(Membre::class);
    }

    /**
     * Relation avec la promesse
     */
    public function promesse()
    {
        return $this->belongsTo(Promesse::class);
    }

    /**
     * Scope pour les paiements d'engagement
     */
    public function scopeEngagements($query)
    {
        return $query->where('type', 'engagement');
    }

    /**
     * Scope pour les dîmes
     */
    public function scopeDimes($query)
    {
        return $query->where('type', 'dime');
    }

    /**
     * Scope pour les paiements complets
     */
    public function scopeComplets($query)
    {
        return $query->where('statut', 'complete');
    }

    /**
     * Scope pour une période donnée
     */
    public function scopePeriode($query, $debut, $fin)
    {
        return $query->whereBetween('date_paiement', [$debut, $fin]);
    }
}