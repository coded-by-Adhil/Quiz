<?php

namespace App\Http\Controllers;

use App\Http\Requests\SuperAdmin\ListAdminsRequest;
use App\Http\Requests\SuperAdmin\UpdateAdminApprovalRequest;
use App\Http\Resources\SuperAdmin\SuperAdminAdminDetailResource;
use App\Http\Resources\SuperAdmin\SuperAdminAdminResource;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizLink;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SuperAdminController extends Controller
{
    public function stats(): JsonResponse
    {
        $adminQuery = User::query()->where('role', 'admin');

        return response()->json([
            'total_admins' => (clone $adminQuery)->count(),
            'approved_admins' => (clone $adminQuery)->where('is_approved', true)->count(),
            'pending_admins' => (clone $adminQuery)->where('is_approved', false)->count(),
            'total_quizzes' => Quiz::query()->count(),
            'total_quiz_links' => QuizLink::query()->whereHas('quiz')->count(),
            'total_submitted_attempts' => QuizAttempt::query()
                ->whereNotNull('submitted_at')
                ->count(),
        ]);
    }

    public function index(ListAdminsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $query = User::query()
            ->where('role', 'admin');

        if (array_key_exists('status', $validated) && $validated['status'] !== null) {
            $query->where('is_approved', $validated['status'] === 'approved');
        }

        if (! empty($validated['search'] ?? null)) {
            $search = $validated['search'];
            $query->where(function ($userQuery) use ($search): void {
                $userQuery
                    ->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%');
            });
        }

        $admins = $query
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($validated['per_page'] ?? 20)
            ->withQueryString();

        return SuperAdminAdminResource::collection($admins)->response();
    }

    public function show(string $admin): JsonResponse
    {
        $adminUser = User::query()
            ->where('role', 'admin')
            ->findOrFail($admin);

        $adminUser->setAttribute(
            'questions_count',
            Question::query()
                ->where('created_by', $adminUser->id)
                ->count()
        );
        $adminUser->setAttribute(
            'quizzes_count',
            Quiz::query()
                ->where('owner_id', $adminUser->id)
                ->count()
        );
        $adminUser->setAttribute(
            'quiz_links_count',
            QuizLink::query()
                ->whereHas('quiz', function ($quizQuery) use ($adminUser): void {
                    $quizQuery->where('owner_id', $adminUser->id);
                })
                ->count()
        );

        return (new SuperAdminAdminDetailResource($adminUser))->response();
    }

    public function update(
        UpdateAdminApprovalRequest $request,
        string $admin
    ): JsonResponse {
        $adminUser = User::query()
            ->where('role', 'admin')
            ->findOrFail($admin);
        $isApproved = (bool) $request->validated()['is_approved'];

        DB::transaction(function () use ($adminUser, $isApproved): void {
            $wasApproved = (bool) $adminUser->is_approved;
            $adminUser->is_approved = $isApproved;
            $adminUser->save();

            if ($wasApproved && ! $isApproved) {
                $adminUser->tokens()->delete();
            }
        });

        return (new SuperAdminAdminResource($adminUser->refresh()))->response();
    }
}
