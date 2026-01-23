<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StatisticsCache extends Model
{
    protected $table = 'statistics_cache'; // Préciser le nom si différent du pluriel auto

    protected $fillable = [
        'periode', 'construction_totale', 'construction_usd', 
        'construction_cdf', 'total_dime', 'dime_usd', 
        'dime_cdf', 'nombre_contributeurs', 'taux_realisation_promesses'
    ];
}