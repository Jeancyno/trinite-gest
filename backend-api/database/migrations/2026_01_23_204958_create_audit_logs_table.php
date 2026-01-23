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
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users'); // L'auteur de l'action
                $table->string('action'); // 'CREATE_PAYMENT', 'UPDATE_MEMBER', 'DELETE_PROMISE'
                $table->string('table_concernee'); // 'paiements', 'membres', etc.
                $table->text('description'); // Détails de la modification
                $table->string('ip_address')->nullable(); // Optionnel pour la sécurité
                $table->timestamps();
            });
        }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
