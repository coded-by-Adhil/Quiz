<?php

use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\GuestQuizController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuizLinkController;
use App\Http\Controllers\SuperAdminController;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json([
        'status' => 'ok',
    ]);
});

Route::get('/health', function (Request $request) {
    $cacheStore = config('cache.default') === 'database'
        ? 'file'
        : config('cache.default');
    $rateLimiter = new RateLimiter(Cache::store($cacheStore));
    $rateLimitKey = 'api-health|'.$request->ip();

    if ($rateLimiter->tooManyAttempts($rateLimitKey, 30)) {
        return response()->json([
            'message' => 'Too Many Requests.',
        ], 429, [
            'Retry-After' => $rateLimiter->availableIn($rateLimitKey),
        ]);
    }

    $rateLimiter->hit($rateLimitKey, 60);

    try {
        DB::select('select 1');

        return response()->json([
            'status' => 'ok',
            'database' => 'connected',
        ]);
    } catch (\Throwable $exception) {
        Log::error('Database health check failed.', [
            'exception' => $exception,
        ]);

        return response()->json([
            'status' => 'error',
            'database' => 'disconnected',
        ], 503);
    }
});

Route::post('/admin/register', [AdminAuthController::class, 'register']);
Route::post('/admin/login', [AdminAuthController::class, 'login']);

Route::get('/quiz/{token}', [GuestQuizController::class, 'show']);
Route::get('/quiz/{token}/attempts/{attemptId}/result', [GuestQuizController::class, 'result'])
    ->whereUuid('attemptId');

Route::middleware('throttle:10,1')->group(function () {
    Route::post('/quiz/{token}/start', [GuestQuizController::class, 'start']);
    Route::post('/quiz/{token}/attempts/{attemptId}/submit', [GuestQuizController::class, 'submit'])
        ->whereUuid('attemptId');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    Route::get('/me', [AdminAuthController::class, 'me']);

    Route::get('/admin/questions', [QuestionController::class, 'index']);
    Route::post('/admin/questions', [QuestionController::class, 'store']);
    Route::get('/admin/questions/{question}', [QuestionController::class, 'show']);
    Route::put('/admin/questions/{question}', [QuestionController::class, 'update']);
    Route::delete('/admin/questions/{question}', [QuestionController::class, 'destroy']);

    Route::get('/admin/quizzes', [QuizController::class, 'index']);
    Route::get('/admin/quizzes/{quiz}/attempts', [QuizController::class, 'attempts']);
    Route::post('/admin/quizzes', [QuizController::class, 'store']);
    Route::get('/admin/quizzes/{quiz}', [QuizController::class, 'show']);
    Route::put('/admin/quizzes/{quiz}', [QuizController::class, 'update']);
    Route::delete('/admin/quizzes/{quiz}', [QuizController::class, 'destroy']);
    Route::post('/admin/quizzes/{quiz}/questions', [QuizController::class, 'syncQuestions']);

    Route::post('/admin/quizzes/{quiz}/links', [QuizLinkController::class, 'store']);
    Route::get('/admin/quizzes/{quiz}/links', [QuizLinkController::class, 'index']);
    Route::patch('/admin/links/{link}', [QuizLinkController::class, 'toggleActive']);
});

Route::middleware(['auth:sanctum', 'superadmin'])
    ->prefix('superadmin')
    ->group(function (): void {
        Route::get('/stats', [SuperAdminController::class, 'stats']);
        Route::get('/admins', [SuperAdminController::class, 'index']);
        Route::get('/admins/{admin}', [SuperAdminController::class, 'show'])
            ->whereNumber('admin');
        Route::patch('/admins/{admin}', [SuperAdminController::class, 'update'])
            ->whereNumber('admin');
    });
