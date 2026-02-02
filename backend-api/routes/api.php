<?php
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    AuthController, 
    MembreController, 
    PromesseController, 
    PaiementController, 
    FactureController, 
    StatsController,
    DimeController,
    ProfileController,
    CaptchaController,
    DepenseController,
};


/*
|--------------------------------------------------------------------------
| API ROUTES — TRINITÉ-GEST
|--------------------------------------------------------------------------
*/

/* |==========================================================
| 1. ROUTES PUBLIQUES
|========================================================== 
*/
// Route temporaire pour nettoyer les doublons


Route::get('/ping', fn () => response()->json(['status' => 'OK', 'time' => now()]));

// Authentification de base
Route::post('/login', [AuthController::class, 'login']);
Route::post('/password/request-reset', [AuthController::class, 'requestReset']);
Route::post('/password/reset', [AuthController::class, 'reset']);

// Inscriptions / Vérifications publiques (QR Code / Formulaire externe)
Route::get('/membres/etat-engagements', [MembreController::class, 'getEtatEngagements']);
Route::get('/membres/exists/{telephone}', [MembreController::class, 'checkExists']);
Route::get('/membres/search-by-phone/{telephone}', [MembreController::class, 'searchByPhonePublic']);
Route::post('/membres/public', [MembreController::class, 'storePublic']);
Route::get('/promesses/pending-public/{telephone}', [PromesseController::class, 'checkPendingPublic']);
Route::post('/promesses/public', [PromesseController::class, 'storePublic']);
 Route::apiResource('paiements', PaiementController::class);
//recaptcha

// routes/api.php - TEMPORAIREMENT
Route::get('/test-dimes', function() {
    try {
        $totalUSD = DB::table('dimes')->where('devise', 'USD')->sum('montant');
        $totalCDF = DB::table('dimes')->where('devise', 'CDF')->sum('montant');
        
        return response()->json([
            'success' => true,
            'data' => [
                'usd' => $totalUSD,
                'cdf' => $totalCDF,
                'total' => $totalUSD + $totalCDF
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});


 Route::get('/promesses/stats', [PromesseController::class, 'stats']);
        Route::get('/promesses/overdue', [PromesseController::class, 'overdue']);
        Route::get('/promesses/pending/{memberId}', [PromesseController::class, 'checkPending']);
        Route::get('/promesses/member/{memberId}', [PromesseController::class, 'getByMember']);
        Route::put('/promesses/{id}/complete', [PromesseController::class, 'complete']);
        Route::put('/promesses/{id}/cancel', [PromesseController::class, 'cancel']);
        Route::apiResource('promesses', PromesseController::class);


Route::post('/verify-captcha', function (Request $request) {

    if (!$request->token) {
        return response()->json(['success' => false]);
    }

    $response = Http::asForm()->post(
        'https://www.google.com/recaptcha/api/siteverify',
        [
            'secret' => env('RECAPTCHA_SECRET'),
            'response' => $request->token,
        ]
    );

    return $response->json();
});



/* |==========================================================
| 2. ROUTES PROTÉGÉES (AUTH:SANCTUM)
|========================================================== 
*/

Route::middleware('auth:sanctum')->group(function () {

    /* ---------- GESTION DU PROFIL PERSONNEL ---------- */
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'getProfile']);
        Route::post('/update', [ProfileController::class, 'updateProfile']);
        Route::post('/avatar', [ProfileController::class, 'updateAvatar']);
        Route::delete('/avatar', [ProfileController::class, 'deleteAvatar']);
        Route::post('/settings', [ProfileController::class, 'updateSettings']);
        
        
    });

    /* ---------- AUTH & VALIDATION ---------- */
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/validate-token', fn () => response()->json(['valid' => true]));


    /* ======================================================
       DASHBOARD — STATISTIQUES GLOBALES
    ====================================================== */
    Route::middleware('role:secretaire,pasteur,super_admin')->get(
        '/dashboard/global',
        [StatsController::class, 'getGlobalStats']
    );


    /* ======================================================
       DÎMES (Gestion des offrandes)
    ====================================================== */
    Route::middleware('role:secretaire,pasteur,super_admin,tresorier')->group(function () {
        Route::get('/dimes/recentes', [DimeController::class, 'recentes']);
        Route::get('/dimes/statistiques', [DimeController::class, 'statistiques']);
        Route::get('/dimes/export', [DimeController::class, 'export']);
        Route::apiResource('dimes', DimeController::class);
    });


       Route::get('/membres/stats', [MembreController::class, 'stats']);
        Route::get('/membres/search', [MembreController::class, 'search']);
        Route::get('/membres/list', [MembreController::class, 'list']);
        Route::get('/membres/presence-report', [MembreController::class, 'presenceReport']);
        Route::apiResource('membres', MembreController::class);

    /* ======================================================
       MEMBRES (Gestion de la base de données fidèles)
    ====================================================== */
    Route::middleware('role:secretaire,pasteur,super_admin,tresorier')->group(function () {
        Route::get('/membres/stats', [MembreController::class, 'stats']);
        Route::get('/membres/search', [MembreController::class, 'search']);
        Route::get('/membres/list', [MembreController::class, 'list']);
        Route::get('/membres/presence-report', [MembreController::class, 'presenceReport']);
        Route::apiResource('membres', MembreController::class);
    });


            /* ======================================================
            DEPENSES (À l'intérieur du groupe auth:sanctum)
            ====================================================== */
            Route::middleware('role:secretaire,super_admin,tresorier')->group(function () {
                Route::get('/depenses/soldes', [DepenseController::class, 'getSoldes']); 
                Route::get('/depenses', [DepenseController::class, 'index']);
                Route::post('/depenses', [DepenseController::class, 'store']);
                Route::get('/depenses/stats', [DepenseController::class, 'stats']);
                Route::apiResource('depenses', DepenseController::class);
            });


    /* ======================================================
       PAIEMENTS & FACTURES (Construction & Projets)
    ====================================================== */
    Route::middleware('role:super_admin,secretaire,tresorier')->group(function () {
       
        Route::get('/factures', [FactureController::class, 'index']);
        Route::get('/factures/{id}', [FactureController::class, 'show']);
    });



    

});

/* |==========================================================
| 3. FALLBACK (ROUTE NON TROUVÉE)
|========================================================== 
*/

Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'Route API non trouvée ou accès non autorisé.'
    ], 404);
});