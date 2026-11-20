<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/health', function () {
    return response()->json([
        'service' => 'user-service',
        'status' => 'healthy'
    ]);
});

Route::middleware('throttle:10,1')->group(function () {

    Route::post('/register', [AuthController::class, 'register']);

    Route::post('/login', [AuthController::class, 'login']);

});

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', [AuthController::class, 'user']);

    Route::post('/logout', [AuthController::class, 'logout']);

});



Route::get('/ready', function () {
    try {
        \Illuminate\Support\Facades\DB::select('SELECT 1');

        return response()->json([
            'status' => 'ready'
        ], 200);

    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'not ready'
        ], 503);
    }
});
