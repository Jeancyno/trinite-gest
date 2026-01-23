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
    Schema::create('paiements', function (Blueprint $table) {
        $table->id();
        $table->foreignId('membre_id')->constrained('membres');
        // Optionnel : lié à une promesse si c'est pour la construction
        $table->foreignId('promesse_id')->nullable()->constrained('promesses'); 
        
        $table->decimal('montant_paye', 15, 2);
        $table->string('devise'); // USD ou CDF
        $table->string('type_paiement'); // 'dime', 'construction', 'offrande'
        $table->string('mode_paiement'); // 'cash', 'orange_money', 'airtel_money', 'visa'
        $table->string('reference_transaction')->nullable(); // Pour les preuves de paiement en ligne
        
        $table->foreignId('perçu_par')->constrained('users'); // Qui a enregistré le paiement
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
