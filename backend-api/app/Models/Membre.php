<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Membre extends Model
{
    use HasFactory;
    protected $fillable = ['nom', 'postnom', 'prenom','sexe', 'telephone', 'adresse'];

    // Un membre peut faire plusieurs promesses (ex: pour différents projets)
    public function promesses(): HasMany
    {
        return $this->hasMany(Promesse::class);
    }

    // Un membre effectue plusieurs paiements
    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }
}