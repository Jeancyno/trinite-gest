<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membre_id')->constrained()->onDelete('cascade'); 
            $table->foreignId('promesse_id')->constrained()->onDelete('cascade');
            $table->decimal('montant', 12, 2); // On garde 'montant' comme nom de référence
            $table->enum('methode_paiement', ['cash', 'mobile_money', 'carte', 'virement', 'especes']);
            $table->date('date_paiement');
            $table->enum('statut', ['en_attente', 'complete', 'echoue'])->default('complete');
            $table->text('observation')->nullable();
             $table->enum('type', ['engagement', 'dime',])->default('engagement');
            $table->timestamps();
            $table->index(['membre_id', 'date_paiement']);
            $table->index(['promesse_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};