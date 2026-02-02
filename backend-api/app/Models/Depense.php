<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Depense extends Model
{
    use HasFactory;

    // Autorise Laravel à remplir ces colonnes automatiquement
    protected $fillable = [
        'motif',
        'montant',
        'devise',
        'source',
        'date_depense',
        'details',
        'user_id'
    ];

    /**
     * Relation avec l'utilisateur (le secrétaire qui a fait la dépense)
     */
    public function secretaire()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}