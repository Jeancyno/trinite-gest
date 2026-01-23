<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Paiement extends Model
{
    protected $fillable = [
        'membre_id', 'promesse_id', 'montant_paye', 
        'devise', 'type_paiement', 'mode_paiement', 
        'reference_transaction', 'perçu_par'
    ];

    public function membre(): BelongsTo
    {
        return $this->belongsTo(Membre::class);
    }

    // Si c'est un paiement de construction, il est lié à une promesse
    public function promesse(): BelongsTo
    {
        return $this->belongsTo(Promesse::class);
    }

    // Chaque paiement génère une facture
    public function facture(): HasOne
    {
        return $this->hasOne(Facture::class); 
    }
}