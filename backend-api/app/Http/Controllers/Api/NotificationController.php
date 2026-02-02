<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    // Récupérer les notifications de l'utilisateur
   // NotificationController.php
public function index(Request $request)
{
    $user = Auth::user();
    $query = Notification::query();
    
    // Filtrer par utilisateur
    $query->where(function($q) use ($user) {
        $q->where('user_id', $user->id)
          ->orWhereNull('user_id')
          ->orWhere('user_type', 'all');
    });
    
    // Filtrer par rôle
    if ($user->role) {
        $query->orWhere('user_type', $user->role);
    }
    
    // Filtrer par type de notification
    if ($request->has('filter')) {
        if ($request->filter === 'unread') {
            $query->where('is_read', false);
        } elseif ($request->filter === 'payment') {
            $query->where('type', 'payment');
        } elseif ($request->filter === 'member') {
            $query->where('type', 'member');
        } elseif ($request->filter === 'warning') {
            $query->where('type', 'warning');
        }
    }
    
    $notifications = $query->orderBy('created_at', 'desc')
                          ->limit(20)
                          ->get();
    
    return response()->json([
        'data' => $notifications,
        'count' => $notifications->count(),
        'unread_count' => $notifications->where('is_read', false)->count()
    ]);
}

public function unreadCount(Request $request)
{
    $user = Auth::user();
    
    $count = Notification::where(function($query) use ($user) {
        $query->where('user_id', $user->id)
              ->orWhereNull('user_id')
              ->orWhere('user_type', 'all');
    })
    ->where('is_read', false)
    ->count();
    
    return response()->json(['count' => $count]);
}}