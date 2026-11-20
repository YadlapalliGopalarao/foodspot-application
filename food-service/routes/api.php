
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FoodController;
use App\Http\Middleware\AdminMiddleware;

Route::get('/health', function () {
    return response()->json([
        'service' => 'food-service',
        'status' => 'healthy'
    ]);
});

// Public APIs
Route::get('/foods', [FoodController::class, 'index']);
Route::get('/foods/{food}', [FoodController::class, 'show']);

// Admin APIs
Route::middleware(AdminMiddleware::class)->group(function () {

    Route::post('/foods', [FoodController::class, 'store']);

    Route::put('/foods/{food}', [FoodController::class, 'update']);

    Route::delete('/foods/{food}', [FoodController::class, 'destroy']);

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
