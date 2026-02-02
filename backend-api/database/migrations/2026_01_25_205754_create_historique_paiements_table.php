<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('historique_paiements', function (Blueprint $table) {
        $table->id();
        $table->foreignId('membre_id')->constrained('membres')->onDelete('cascade');
        
        // Type de mouvement : 'Dîme', 'Construction', 'Action de grâce', etc.
        $table->string('type_paiement'); 
        
        // Polymorphisme (Optionnel mais pro) : permet de lier à la table exacte
        $table->unsignedBigInteger('reference_id'); 
        
        $table->decimal('montant', 15, 2);
        $table->string('devise')->default('USD');
        $table->date('date_transaction');
        $table->string('methode')->default('Espèces');
        
        $table->foreignId('user_id')->constrained(); // Le percepteur
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historique_paiements');
    }
};
