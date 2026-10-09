<?php

namespace App\Http\Controllers;

use App\Http\Requests\Guest\StartQuizRequest;
use App\Http\Requests\Guest\SubmitQuizRequest;
use App\Http\Resources\Guest\GuestQuestionResource;
use App\Http\Resources\Guest\GuestQuizMetaResource;
use App\Http\Resources\Guest\QuizAttemptResultResource;
use App\Models\QuizAttempt;
use App\Models\QuizLink;
use App\Services\QuizScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GuestQuizController extends Controller
{
    public function show(Request $request, string $token): JsonResponse
    {
        $link = $this->resolveActiveLink($token);

        return response()->json(
            (new GuestQuizMetaResource($link->quiz))->resolve($request)
        );
    }

    public function start(StartQuizRequest $request, string $token): JsonResponse
    {
        $link = $this->resolveActiveLink($token);
        $questions = $link->questions()->with('options')->get();
        $validated = $request->validated();

        $attempt = DB::transaction(function () use ($link, $questions, $validated): QuizAttempt {
            $attempt = new QuizAttempt();
            $attempt->quiz_link_id = $link->id;
            $attempt->participant_name = $validated['participant_name'];
            $attempt->started_at = now();
            $attempt->total_marks = $questions->sum('marks');
            $attempt->save();

            return $attempt;
        });

        return response()->json([
            'attempt_id' => $attempt->id,
            'participant_name' => $attempt->participant_name,
            'started_at' => $attempt->started_at,
            'duration_minutes' => $link->quiz->duration_minutes,
            'questions' => GuestQuestionResource::collection($questions)->resolve($request),
        ], 201);
    }

    public function submit(
        SubmitQuizRequest $request,
        string $token,
        string $attemptId,
        QuizScoringService $scoringService
    ): JsonResponse {
        $link = $this->resolveActiveLink($token);
        $attempt = QuizAttempt::query()
            ->whereKey($attemptId)
            ->where('quiz_link_id', $link->id)
            ->first();

        if ($attempt === null) {
            abort(404, 'Attempt not found.');
        }

        $attempt = $scoringService->scoreAndPersist(
            $attempt,
            $link,
            $request->validated()['answers']
        );

        return response()->json([
            'attempt_id' => $attempt->id,
            'score' => $attempt->score,
            'total_marks' => $attempt->total_marks,
            'submitted_at' => $attempt->submitted_at,
        ]);
    }

    public function result(
        Request $request,
        string $token,
        string $attemptId
    ): JsonResponse {
        $link = $this->resolveActiveLink($token);
        $attempt = QuizAttempt::query()
            ->whereKey($attemptId)
            ->where('quiz_link_id', $link->id)
            ->whereNotNull('submitted_at')
            ->first();

        if ($attempt === null) {
            abort(404, 'Attempt result not found.');
        }

        return response()->json(
            (new QuizAttemptResultResource($attempt))->resolve($request)
        );
    }

    private function resolveActiveLink(string $token): QuizLink
    {
        $link = QuizLink::query()
            ->where('token', $token)
            ->with('quiz')
            ->first();

        if ($link === null) {
            abort(404, 'Quiz link not found.');
        }

        if (! $link->is_active) {
            abort(403, 'This quiz link is no longer available.');
        }

        return $link;
    }
}
