<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CaptchaController extends Controller
{
    public function verify(Request $request)
    {
        $request->validate([
            'token' => 'required'
        ]);

        $response = Http::asForm()->post(
            'https://www.google.com/recaptcha/api/siteverify',
            [
                'secret' => env('RECAPTCHA_SECRET'),
                'response' => $request->token
            ]
        );

        return response()->json([
            'success' => $response['success'] ?? false
        ]);
    }
}
