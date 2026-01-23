<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promesse extends Model
{
    protected $fillable = ['membre_id', 'montant_total', 'devise', 'duree_mois', 'date_debut'];

    public function paiements()
    {
        return $this->hasMany(Paiement::class);
    }

    // Somme déjà payée pour cette promesse
    public function totalPaye()
    {
        return $this->paiements()->sum('montant_paye');
    }

    // Reste à payer
    public function resteAPayer()
    {
        return $this->montant_total - $this->totalPaye();
    }
}