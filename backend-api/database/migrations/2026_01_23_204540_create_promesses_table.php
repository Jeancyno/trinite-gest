<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membre_id')->constrained()->onDelete('cascade');
            $table->decimal('montant_total', 12, 2);
            $table->enum('devise', ['USD', 'CDF', 'EUR'])->default('USD');
            $table->integer('duree_mois');
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->text('observation')->nullable();
            $table->enum('statut', ['actif', 'termine', 'annule'])->default('actif');
            $table->string('photo')->nullable();
            $table->timestamps();
            
            // Index
            $table->index('membre_id');
            $table->index('statut');
            $table->index('date_debut');
            $table->index('date_fin');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promesses');
    }
};