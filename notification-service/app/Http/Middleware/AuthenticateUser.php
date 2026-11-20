<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        $url = config('services.user_service.url');

        if (!$url) {
            return response()->json([
                'message' => 'User service configuration missing'
            ], 503);
        }

        try {
            $response = Http::acceptJson()
                ->withToken($token)
                ->withoutRedirecting()
                ->connectTimeout(2)
                ->timeout(5)
                ->get(rtrim($url, '/') . '/api/user');

        } catch (ConnectionException $e) {
            return response()->json([
                'message' => 'User service unavailable'
            ], 503);
        }

        if ($response->status() === 401 || $response->status() === 403) {
            return response()->json([
                'message' => 'Invalid token'
            ], 401);
        }

        if (!$response->successful() || !$response->json('id')) {
            return response()->json([
                'message' => 'Invalid user service response'
            ], 503);
        }

        $request->attributes->set(
            'authenticated_user_id',
            $response->json('id')
        );

        return $next($request);
    }
}
