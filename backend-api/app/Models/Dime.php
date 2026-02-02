<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dime extends Model
{
    use HasFactory;

    /**
     * Les attributs qui sont mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
         'membre_id',
        'devise',
        'montant_usd',
        'montant_cdf',
        'mois',
        'date_versement',
        'methode_paiement',
        'note',
        'enregistre_par'
    ];

       protected $casts = [
         'montant_usd' => 'decimal:2',
        'montant_cdf' => 'decimal:2',
        'date_versement' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Les attributs qui doivent être castés.
     *
     * @var array<string, string>
     */
  

    /**
     * Les valeurs par défaut du modèle.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'devise' => 'USD',
        'methode_paiement' => 'Espèces'
    ];


    public function getMontantTotalAttribute()
    {
        if ($this->devise === 'USD') {
            return $this->montant_usd;
        } else {
            return $this->montant_cdf;
        }
    }

    // Raccourci utile
    public function getMontantAttribute()
    {
        return $this->getMontantTotalAttribute();
    }

    /**
     * Relation avec le membre.
     */
    public function membre(): BelongsTo
    {
        return $this->belongsTo(Membre::class);
    }

    /**
     * Relation avec l'utilisateur qui a enregistré.
     */
    public function enregistreur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enregistre_par');
    }

    /**
     * Scope pour les dîmes d'un mois spécifique.
     */
    public function scopeDuMois($query, $mois)
    {
        return $query->where('mois', $mois);
    }

    /**
     * Scope pour les dîmes d'une période.
     */
    public function scopeEntreDates($query, $debut, $fin)
    {
        return $query->whereBetween('date_versement', [$debut, $fin]);
    }

    /**
     * Scope pour les dîmes par méthode de paiement.
     */
    public function scopeParMethode($query, $methode)
    {
        return $query->where('methode_paiement', $methode);
    }

    /**
     * Scope pour les dîmes d'un membre.
     */
    public function scopeDuMembre($query, $membreId)
    {
        return $query->where('membre_id', $membreId);
    }

    

    /**
     * Formater le mois pour l'affichage.
     */
    public function getMoisFormateAttribute(): string
    {
        // Si le mois est déjà en format texte (ex: "Janvier")
        if (!preg_match('/^\d{4}-\d{2}$/', $this->mois)) {
            return $this->mois;
        }
        
        // Si le mois est en format YYYY-MM
        $moisNoms = [
            '01' => 'Janvier', '02' => 'Février', '03' => 'Mars',
            '04' => 'Avril', '05' => 'Mai', '06' => 'Juin',
            '07' => 'Juillet', '08' => 'Août', '09' => 'Septembre',
            '10' => 'Octobre', '11' => 'Novembre', '12' => 'Décembre'
        ];
        
        $parts = explode('-', $this->mois);
        return $moisNoms[$parts[1]] . ' ' . $parts[0];
    }

    /**
     * Calculer le montant total pour une période.
     */
    public static function totalPourPeriode($debut = null, $fin = null)
    {
        $query = self::query();
        
        if ($debut && $fin) {
            $query->whereBetween('date_versement', [$debut, $fin]);
        }
        
        return $query->sum('montant');
    }

    /**
     * Obtenir les statistiques des méthodes de paiement.
     */
    public static function statsMethodes($debut = null, $fin = null)
    {
        $query = self::query();
        
        if ($debut && $fin) {
            $query->whereBetween('date_versement', [$debut, $fin]);
        }
        
        return $query->selectRaw('methode_paiement, SUM(montant) as total, COUNT(*) as nombre')
            ->groupBy('methode_paiement')
            ->get();
    }
  
}