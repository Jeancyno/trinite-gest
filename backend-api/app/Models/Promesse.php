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
    /**
     * Get total amount paid.
     */
   public function totalPaid() {
  return $this->hasMany(Paiement::class)->sum('montant') ?? 0;
}

public function remainingAmount() {
    return $this->montant_total - $this->totalPaid();
}

public function paymentPercentage() {
    return $this->montant_total > 0 ? round(($this->totalPaid() / $this->montant_total) * 100, 1) : 0;
}
  
public function membre() {
    return $this->belongsTo(Membre::class);
}



}