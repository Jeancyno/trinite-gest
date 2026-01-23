<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationSms extends Model
{
    protected $table = 'notifications_sms';

    protected $fillable = ['membre_id', 'type_rappel', 'date_envoi', 'statut'];

    public function membre(): BelongsTo
    {
        return $this->belongsTo(Membre::class);
    }
}