<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = ['user_id', 'action', 'table_concernee', 'description', 'ip_address'];

    // Savoir quel utilisateur a fait l'action
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}