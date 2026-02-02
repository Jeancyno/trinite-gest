<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécute les migrations.
     */
    public function up(): void
    {
        // 1. Supprimer l'ancienne table si elle existe
        Schema::dropIfExists('dimes');
        
        // 2. Créer la nouvelle table avec la structure propre
        Schema::create('dimes', function (Blueprint $table) {
            $table->id();
            
            // Référence au membre
            $table->foreignId('membre_id')
                  ->constrained('membres')
                  ->onDelete('cascade')
                  ->comment('Membre qui a payé la dîme');
            
            // Devise et montants séparés
            $table->enum('devise', ['USD', 'CDF', 'EUR'])
                  ->default('USD')
                  ->comment('Devise du paiement (USD, CDF, EUR)');
            
            $table->decimal('montant_usd', 12, 2)
                  ->default(0)
                  ->comment('Montant en dollars américains');
            
            $table->decimal('montant_cdf', 15, 2)
                  ->default(0)
                  ->comment('Montant en francs congolais');
            
            // Informations sur le paiement
            $table->string('mois', 50)
                  ->comment('Mois de la dîme (ex: "Janvier 2024", "2024-01")');
            
            $table->date('date_versement')
                  ->comment('Date effective du versement');
            
            $table->enum('methode_paiement', [
                'Espèces', 
                'Mobile Money', 
                'Banque', 
                'Virement', 
                'Carte de crédit', 
                'Chèque', 
                'Autre'
            ])->default('Espèces')
              ->comment('Méthode utilisée pour le paiement');
            
            // Notes et métadonnées
            $table->text('note')
                  ->nullable()
                  ->comment('Observations ou commentaires');
            
            $table->foreignId('enregistre_par')
                  ->constrained('users')
                  ->onDelete('cascade')
                  ->comment('Utilisateur qui a enregistré la dîme');
            
            // Horodatages
            $table->timestamps();
            
            // ============================================
            // INDEX pour optimiser les performances
            // ============================================
            
            // Pour les recherches par date (très fréquent)
            $table->index('date_versement');
            
            // Pour les rapports par mois
            $table->index('mois');
            
            // Pour les recherches par membre
            $table->index('membre_id');
            
            // Pour les recherches combinées
            $table->index(['membre_id', 'date_versement']);
            $table->index(['methode_paiement', 'date_versement']);
            
            // Pour les statistiques par devise
            $table->index(['devise', 'date_versement']);
            
            // Index composite pour les totaux par membre/mois
            $table->index(['membre_id', 'mois', 'devise']);
            
            // Commentaire sur la table
            $table->comment('Table des dîmes - Paiements séparés par devise sans colonne montant général');
        });
        
        // ============================================
        // VÉRIFICATIONS et initialisations
        // ============================================
        
        // Vérifier que la table a été créée
        if (Schema::hasTable('dimes')) {
            \Illuminate\Support\Facades\Log::info('✅ Table dimes créée avec succès');
        } else {
            \Illuminate\Support\Facades\Log::error('❌ Échec de création de la table dimes');
        }
        
      
    }

    /**
     * Annule les migrations.
     */
    public function down(): void
    {
        // Supprimer la table
        Schema::dropIfExists('dimes');
        
        \Illuminate\Support\Facades\Log::info('🗑️ Table dimes supprimée (rollback)');
    }
};