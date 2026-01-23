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
    Schema::create('permissions', function (Blueprint $table) {
        $table->id();
        $table->string('nom'); // ex: 'peut_imprimer_rapport_A4', 'peut_valider_dime'
        $table->string('slug')->unique(); // 'print_report', 'validate_tithe'
        $table->timestamps();
    });

    // Table pivot pour lier les rôles aux permissions
    Schema::create('permission_role', function (Blueprint $table) {
        $table->id();
        $table->string('role'); // pasteur, secretaire_1, etc.
        $table->foreignId('permission_id')->constrained();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
