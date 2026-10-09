<?php

namespace App\Http\Controllers;

use App\Http\Requests\Quiz\AdminQuizAttemptsRequest;
use App\Http\Requests\Quiz\AdminQuizIndexRequest;
use App\Http\Requests\Quiz\StoreQuizRequest;
use App\Http\Requests\Quiz\SyncQuizQuestionsRequest;
use App\Http\Requests\Quiz\UpdateQuizRequest;
use App\Http\Resources\Admin\AdminQuizAttemptResource;
use App\Http\Resources\Admin\AdminQuizResource;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    public function index(AdminQuizIndexRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Quiz::class);

        $validated = $request->validated();
        $sort = $validated['sort'] ?? 'title';
        $direction = $validated['direction'] ?? 'asc';

        $query = Quiz::query()
            ->where('owner_id', auth()->id());

        if (! empty($validated['search'] ?? null)) {
            $query->where('title', 'like', '%'.$validated['search'].'%');
        }

        $quizzes = $query
            ->orderBy($sort, $direction)
            ->orderBy('id', $direction)
            ->paginate(15)
            ->withQueryString();

        return AdminQuizResource::collection($quizzes)->response();
    }

    public function attempts(
        AdminQuizAttemptsRequest $request,
        string $quiz
    ): JsonResponse {
        $quizModel = Quiz::withTrashed()->findOrFail($quiz);
        $this->authorize('viewAttempts', $quizModel);

        $validated = $request->validated();
        $sort = $validated['sort'] ?? 'participant_name';
        $direction = $validated['direction'] ?? 'asc';

        $query = QuizAttempt::query()
            ->whereHas('quizLink', function ($linkQuery) use ($quizModel): void {
                $linkQuery->where('quiz_id', $quizModel->id);
            })
            ->whereNotNull('submitted_at');

        if (! empty($validated['search'] ?? null)) {
            $query->where('participant_name', 'like', '%'.$validated['search'].'%');
        }

        $attempts = $query
            ->orderBy($sort, $direction)
            ->orderBy('id', $direction)
            ->paginate(15)
            ->withQueryString();

        return AdminQuizAttemptResource::collection($attempts)->response();
    }

    public function store(StoreQuizRequest $request): JsonResponse
    {
        $this->authorize('create', Quiz::class);

        $validated = $request->validated();
        $quiz = new Quiz();
        $quiz->title = $validated['title'];
        $quiz->description = $validated['description'] ?? null;
        $quiz->duration_minutes = $validated['duration_minutes'] ?? null;
        $quiz->owner_id = auth()->id();
        $quiz->save();

        return response()->json($quiz->load(['questions.options']), 201);
    }

    public function show(Quiz $quiz): JsonResponse
    {
        $this->authorize('view', $quiz);

        return response()->json($quiz->load(['questions.options']));
    }

    public function update(UpdateQuizRequest $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('update', $quiz);

        $validated = $request->validated();
        $quiz->title = $validated['title'];
        $quiz->description = $validated['description'] ?? null;
        $quiz->duration_minutes = $validated['duration_minutes'] ?? null;
        $quiz->save();

        return response()->json($quiz->load(['questions.options']));
    }

    public function destroy(Quiz $quiz): JsonResponse
    {
        $this->authorize('delete', $quiz);
        $quiz->delete();

        return response()->json([
            'message' => 'quiz deleted',
        ]);
    }

    public function syncQuestions(
        SyncQuizQuestionsRequest $request,
        Quiz $quiz
    ): JsonResponse {
        $this->authorize('update', $quiz);

        $questionIds = $request->validated()['question_ids'];
        $syncData = [];

        foreach ($questionIds as $order => $questionId) {
            $syncData[$questionId] = ['order' => $order];
        }

        $quiz = DB::transaction(function () use ($quiz, $syncData): Quiz {
            $quiz->questions()->sync($syncData);

            return $quiz->load(['questions.options']);
        });

        return response()->json($quiz);
    }
}
