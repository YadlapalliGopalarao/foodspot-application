<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // Register a new customer
    public function register(Request $request)
    {
        $this->normalizeEmail($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|max:72',
        ]);

        $user = User::create($validated)->refresh();

        return $this->authenticatedResponse($user, 201);
    }

    // Login an existing customer
    public function login(Request $request)
    {
        $this->normalizeEmail($request);

        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where(
            'email', $validated['email']
        )->first();

        if (!$user || !Hash::check(
            $validated['password'], $user->password
        )) {
            return response()->json([
                'message' => 'Invalid email or password',
            ], 401);
        }

        return $this->authenticatedResponse($user);
    }

    // Get authenticated user
    public function user(Request $request)
    {
        return response()->json(
            $request->user()->only([
                'id', 'name', 'email', 'role'
            ])
        );
    }

    // Logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    // Normalize email address
    private function normalizeEmail(Request $request)
    {
        if (is_string($request->input('email'))) {
            $request->merge([
                'email' => strtolower(trim($request->email))
            ]);
        }
    }

    // Generate authentication response
    private function authenticatedResponse(
        User $user, int $status = 200
    ) {
        $token = $user->createToken(
            'foodspot-token',
            ['*'],
            now()->addHours(8)
        )->plainTextToken;

        return response()->json([
            'user' => $user->only([
                'id', 'name', 'email', 'role'
            ]),
            'token' => $token,
        ], $status);
    }
}

