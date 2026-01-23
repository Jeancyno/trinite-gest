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
            Schema::create('factures', function (Blueprint $table) {
                $table->id();
                $table->string('numero_facture')->unique(); // Ex: 2024-001
                $table->foreignId('paiement_id')->constrained('paiements')->onDelete('cascade');
                $table->timestamp('date_impression')->nullable();
                $table->integer('nombre_impressions')->default(1); // Pour savoir si on a réimprimé un duplicata
                $table->timestamps();
            });
        }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
