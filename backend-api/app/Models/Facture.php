<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Facture extends Model
{
    protected $fillable = ['numero_facture', 'paiement_id', 'date_impression', 'nombre_impressions'];

    // Une facture appartient à un seul paiement
    public function paiement(): BelongsTo
    {
        return $this->belongsTo(Paiement::class);
    }
}