<?php
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MembreController;
use App\Http\Controllers\Api\PromesseController; // On l'ajoute pour la suite
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\FactureController;  
use App\Http\Controllers\Api\StatsController;

// Route publique
Route::post('/login', [AuthController::class, 'login']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/factures', [FactureController::class, 'index']);
    Route::get('/factures/{id}', [FactureController::class, 'show']);
    Route::post('/factures/{facture}/reimprimer', [FactureController::class, 'incrementPrint']);
    Route::get('/dashboard/global', [StatsController::class, 'getGlobalStats']);
    Route::get('/dashboard/history', [StatsController::class, 'getHistory']);
    Route::get('/dashboard/promesses', [StatsController::class, 'getPromesseAnalysis']);
    // Membres
    Route::get('/membres', [MembreController::class, 'index']);
    Route::post('/membres', [MembreController::class, 'store']);
    Route::get('/membres/{membre}', [MembreController::class, 'show']);

    // Promesses (On prépare le terrain)
    Route::get('/promesses', [PromesseController::class, 'index']);
    Route::post('/promesses', [PromesseController::class, 'store']);
    Route::get('/paiements', [PaiementController::class, 'index']);
    Route::post('/paiements', [PaiementController::class, 'store']);
    
});