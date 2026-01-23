<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    /**
     * Affiche l'historique complet des actions
     */
    public function index(Request $request)
    {
        // On permet de filtrer par utilisateur ou par table (ex: voir tout ce qui touche aux 'paiements')
        $user_id = $request->query('user_id');
        $table = $request->query('table');

        $logs = AuditLog::with('user')
            ->when($user_id, function ($query, $user_id) {
                return $query->where('user_id', $user_id);
            })
            ->when($table, function ($query, $table) {
                return $query->where('table_concernee', $table);
            })
            ->latest()
            ->paginate(30);

        return response()->json($logs);
    }

    /**
     * Voir le détail d'une action spécifique
     */
    public function show(AuditLog $auditLog)
    {
        return response()->json($auditLog->load('user'));
    }
}