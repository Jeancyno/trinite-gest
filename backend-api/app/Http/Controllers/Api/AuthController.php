<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // public function login(Request $request)
    // {
    //     $request->validate([
    //         'username' => 'required',
    //         'password' => 'required',
    //     ]);

    //     $user = User::where('username', $request->username)->first();

    //     if (! $user || ! Hash::check($request->password, $user->password)) {
    //         throw ValidationException::withMessages([
    //             'username' => ['Les identifiants sont incorrects.'],
    //         ]);
    //     }

    //     // On crée le token et on renvoie aussi le rôle pour le frontend React
    //     $token = $user->createToken('auth_token')->plainTextToken;

    //     return response()->json([
    //         'access_token' => $token,
    //         'token_type' => 'Bearer',
    //         'role' => $user->role,
    //         'user' => $user->name,
    //          'avatar_url' => $avatarUrl, // La clé pour ton React
    //             'avatar' => $avatarUrl,     // Sécurité supplémentaire
    //     ]);
    // }

    public function login(Request $request)
{
    $request->validate([
        'username' => 'required',
        'password' => 'required',
    ]);

    // On utilise un try/catch pour voir l'erreur exacte dans les logs si ça plante
    try {
        $user = User::where('username', $request->username)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // On récupère l'avatar de manière ultra-sécurisée
        $avatarUrl = asset('images/default-avatar.png'); // Valeur par défaut
        
        if ($user->profile) {
            // Si tu as la méthode getAvatarUrl(), utilise-la. 
            // Sinon, on construit l'URL manuellement :
            $avatarUrl = $user->profile->avatar 
                ? asset('storage/' . $user->profile->avatar) 
                : asset('images/default-avatar.png');
        }

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'avatar_url' => $avatarUrl,
                'avatar' => $avatarUrl,
            ]
        ]);
    } catch (\Exception $e) {
        // Cela te permettra de voir l'erreur dans storage/logs/laravel.log
        return response()->json(['message' => 'Erreur Serveur: ' . $e->getMessage()], 500);
    }
}

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté avec succès']);
    }
}