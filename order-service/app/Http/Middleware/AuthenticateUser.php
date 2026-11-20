<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;

class AuthenticateUser
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        try {
            $response = Http::acceptJson()
                ->withToken($token)
                ->withoutRedirecting()
                ->connectTimeout(2)
                ->timeout(5)
                ->get(config('services.user_service.url') . '/api/user');

        } catch (ConnectionException $e) {
            return response()->json([
                'message' => 'User service unavailable'
            ], 503);
        }

        if ($response->status() === 401) {
            return response()->json([
                'message' => 'Invalid or expired token'
            ], 401);
        }

        if (!$response->successful() || !$response->json('id')) {
            return response()->json([
                'message' => 'Unable to verify user'
            ], 503);
        }

        $request->attributes->set(
            'authenticated_user_id',
            $response->json('id')
        );

        return $next($request);
    }
}
