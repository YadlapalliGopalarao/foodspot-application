<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NotificationController;
use App\Http\Middleware\AuthenticateUser;

Route::get('/health', function () {
    return response()->json([
        'service' => 'notification-service',
        'status' => 'healthy'
    ]);
});

Route::get('/notifications', [
    NotificationController::class, 'index'
])->middleware(AuthenticateUser::class);

Route::post('/internal/notifications', [
    NotificationController::class, 'store'
]);

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

