
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OrderController;
use App\Http\Middleware\AuthenticateUser;

Route::get('/health', function () {
    return response()->json([
        'service' => 'order-service',
        'status' => 'healthy'
    ]);
});

Route::middleware(AuthenticateUser::class)->group(function () {

    Route::get('/orders', [OrderController::class, 'index']);

    Route::post('/orders', [OrderController::class, 'store']);

    Route::get('/orders/{id}', [OrderController::class, 'show'])
        ->whereNumber('id');

    Route::patch('/orders/{id}/cancel', [OrderController::class, 'cancel'])
        ->whereNumber('id');

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
