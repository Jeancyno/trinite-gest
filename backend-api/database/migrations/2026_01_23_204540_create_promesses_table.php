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
    Schema::create('promesses', function (Blueprint $table) {
        $table->id();
        $table->foreignId('membre_id')->constrained('membres')->onDelete('cascade');
        $table->decimal('montant_total', 15, 2); // Le total promis (ex: 60$)
        $table->string('devise')->default('USD'); // USD ou CDF
        $table->integer('duree_mois')->default(6); // La période (ex: 6 mois)
        $table->date('date_debut');
        $table->text('observation')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promesses');
    }
};
