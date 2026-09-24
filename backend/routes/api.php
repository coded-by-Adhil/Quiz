<?php

use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\QuestionController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json([
        'status' => 'ok',
    ]);
});

Route::post('/admin/register', [AdminAuthController::class, 'register']);
Route::post('/admin/login', [AdminAuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    Route::get('/me', [AdminAuthController::class, 'me']);

    Route::get('/admin/questions', [QuestionController::class, 'index']);
    Route::post('/admin/questions', [QuestionController::class, 'store']);
    Route::get('/admin/questions/{question}', [QuestionController::class, 'show']);
    Route::put('/admin/questions/{question}', [QuestionController::class, 'update']);
    Route::delete('/admin/questions/{question}', [QuestionController::class, 'destroy']);
});

