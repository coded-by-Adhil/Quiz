<?php

namespace App\Http\Controllers;

use App\Http\Requests\QuizLink\StoreQuizLinkRequest;
use App\Http\Requests\QuizLink\UpdateQuizLinkRequest;
use App\Models\Quiz;
use App\Models\QuizLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QuizLinkController extends Controller
{
    public function store(StoreQuizLinkRequest $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('create', [QuizLink::class, $quiz]);

        $questionIds = $request->validated()['question_ids'];

        $quizLink = DB::transaction(function () use ($quiz, $questionIds): QuizLink {
            $quizLink = new QuizLink();
            $quizLink->quiz_id = $quiz->id;
            $quizLink->token = $this->generateToken();
            $quizLink->is_active = true;
            $quizLink->save();

            $syncData = [];

            foreach ($questionIds as $order => $questionId) {
                $syncData[$questionId] = ['order' => $order];
            }

            $quizLink->questions()->sync($syncData);

            return $quizLink->load('questions');
        });

        return response()->json($quizLink, 201);
    }

    public function index(Quiz $quiz): JsonResponse
    {
        $this->authorize('viewAny', [QuizLink::class, $quiz]);

        $quizLinks = QuizLink::query()
            ->where('quiz_id', $quiz->id)
            ->with('questions')
            ->latest('id')
            ->get();

        return response()->json($quizLinks);
    }

    public function toggleActive(
        UpdateQuizLinkRequest $request,
        QuizLink $link
    ): JsonResponse {
        $this->authorize('update', $link);

        $link->is_active = $request->validated()['is_active'];
        $link->save();

        return response()->json($link->load('questions'));
    }

    private function generateToken(): string
    {
        do {
            $token = Str::random(40);
        } while (QuizLink::query()->where('token', $token)->exists());

        return $token;
    }
}
