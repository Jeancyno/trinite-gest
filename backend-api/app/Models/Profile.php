<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    use HasFactory;

    /**
     * Les attributs assignables en masse.
     */
    protected $fillable = [
        'user_id',
        'avatar',
        'telephone',
        'poste',
        'settings'
    ];

    /**
     * Les attributs à caster.
     */
    protected $casts = [
        'settings' => 'array',
    ];

    /**
     * Relation avec l'utilisateur.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mettre à jour l'avatar.
     */
    public function updateAvatar($avatarPath)
    {
        // Supprimer l'ancien avatar si existe
        if ($this->avatar && file_exists(public_path($this->avatar))) {
            unlink(public_path($this->avatar));
        }
        
        $this->avatar = $avatarPath;
        $this->save();
        
        return $this;
    }

    /**
     * Obtenir l'URL de l'avatar.
     */
    public function getAvatarUrl()
    {
        return $this->avatar 
            ? asset('storage/' . $this->avatar)
            : asset('images/default-avatar.png');
    }

    /**
     * Mettre à jour les paramètres.
     */
    public function updateSettings(array $settings)
    {
        $currentSettings = $this->settings ?? [];
        $this->settings = array_merge($currentSettings, $settings);
        $this->save();
        
        return $this;
    }
}