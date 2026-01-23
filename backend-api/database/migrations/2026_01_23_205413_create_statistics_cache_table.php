<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('statistics_cache', function (Blueprint $table) {
            $table->id();
            // Format: '2024-01' pour mensuel ou '2024' pour annuel
            $table->string('periode')->index(); 
            
            // Totaux pour la construction
            $table->decimal('construction_totale', 15, 2)->default(0);
            $table->decimal('construction_usd', 15, 2)->default(0);
            $table->decimal('construction_cdf', 15, 2)->default(0);
            
            // Totaux pour la dîme
            $table->decimal('total_dime', 15, 2)->default(0);
            $table->decimal('dime_usd', 15, 2)->default(0);
            $table->decimal('dime_cdf', 15, 2)->default(0);

            // Autres indicateurs clés (KPI)
            $table->integer('nombre_contributeurs')->default(0);
            $table->decimal('taux_realisation_promesses', 5, 2)->default(0); // Pourcentage
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('statistics_cache');
    }
};