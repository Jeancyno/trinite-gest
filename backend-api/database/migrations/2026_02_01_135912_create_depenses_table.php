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
            Schema::create('depenses', function (Blueprint $table) {
                $table->id();
                $table->string('motif'); // ex: "Achat 10 sacs de ciment"
                $table->decimal('montant', 15, 2);
                $table->string('devise', 3); // USD ou CDF
                
                // La source permet de savoir quel budget est impacté
                // 'dime' pour les revenus de la table dimes
                // 'construction' pour les paiements de type 'engagement'
                $table->enum('source', ['dime', 'construction', 'fonctionnement']);
                
                $table->date('date_depense');
                
                // Relation avec l'utilisateur (le secrétaire) qui saisit
                $table->foreignId('user_id')->constrained('users');
                
                $table->text('details')->nullable(); // Infos supplémentaires
                $table->timestamps();
            });
        }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('depenses');
    }
};
