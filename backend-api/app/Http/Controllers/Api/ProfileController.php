<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * Mettre à jour le profil complet de l'utilisateur.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'current_password' => 'required_with:new_password',
            'new_password' => 'nullable|min:6|confirmed',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Changement de mot de passe
            if ($request->filled('new_password')) {
                if (!Hash::check($request->current_password, $user->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Le mot de passe actuel est incorrect'
                    ], 401);
                }
                $user->password = Hash::make($request->new_password);
            }

            $user->name = $request->name;
            $user->save();

            // Gestion de l'image
            if ($request->hasFile('avatar')) {
                // Supprimer l'ancien fichier si nécessaire
                if ($user->profile && $user->profile->avatar) {
                    Storage::disk('public')->delete($user->profile->avatar);
                }

                $avatar = $request->file('avatar');
                $filename = 'avatar_' . $user->id . '_' . time() . '.' . $avatar->getClientOriginalExtension();
                $path = $avatar->storeAs('avatars', $filename, 'public');
                
                $profile = Profile::updateOrCreate(
                    ['user_id' => $user->id],
                    ['avatar' => $path]
                );
            } else {
                $profile = $user->profile;
            }

            $url = $profile ? $profile->getAvatarUrl() : asset('images/default-avatar.png');

            return response()->json([
                'success' => true,
                'message' => 'Profil mis à jour avec succès',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'role' => $user->role,
                    'avatar_url' => $url, // Clé 1
                    'avatar' => $url,     // Clé 2 (Dédoublée pour le Frontend)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer le profil pour le rafraîchissement du localStorage.
     */
    public function getProfile(Request $request)
    {
        $user = $request->user();
        $profile = $user->profile;
        $url = $profile ? $profile->getAvatarUrl() : asset('images/default-avatar.png');
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'avatar_url' => $url,
                'avatar' => $url, // Harmonisation
                'telephone' => $profile->telephone ?? null,
                'poste' => $profile->poste ?? 'Membre',
                'settings' => $profile->settings ?? [],
                'created_at' => $user->created_at->format('d/m/Y'),
            ]
        ]);
    }

    /**
     * Mettre à jour uniquement l'avatar (utilisé par certains boutons rapides).
     */
    public function updateAvatar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120'
        ]);

        if ($validator->fails()) return response()->json(['success' => false, 'errors' => $validator->errors()], 422);

        $user = $request->user();
        $profile = $user->profile;

        if ($profile && $profile->avatar) {
            Storage::disk('public')->delete($profile->avatar);
        }

        $path = $request->file('avatar')->storeAs('avatars', 'avatar_' . $user->id . '_' . time() . '.' . $request->file('avatar')->getClientOriginalExtension(), 'public');

        $profile = Profile::updateOrCreate(['user_id' => $user->id], ['avatar' => $path]);
        $url = $profile->getAvatarUrl();

        return response()->json([
            'success' => true,
            'avatar_url' => $url,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar_url' => $url,
                'avatar' => $url // Harmonisation
            ]
        ]);
    }

    public function deleteAvatar(Request $request)
    {
        $user = $request->user();
        if ($user->profile && $user->profile->avatar) {
            Storage::disk('public')->delete($user->profile->avatar);
            $user->profile->update(['avatar' => null]);
        }

        return response()->json([
            'success' => true,
            'avatar_url' => asset('images/default-avatar.png')
        ]);
    }
}