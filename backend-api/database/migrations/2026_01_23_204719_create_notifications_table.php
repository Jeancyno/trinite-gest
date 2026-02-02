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
            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('membre_id')->constrained('membres');
                $table->string('type_rappel'); // 'echeance_proche', 'retard_paiement'
                $table->string('type')->default('info'); // info, warning, success
                $table->string('user_type')->nullable(); 
                $table->date('date_envoi');
                $table->string('statut'); // 'envoyé', 'échec'
                $table->timestamps();
            });
        }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
