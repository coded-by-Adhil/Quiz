<?php

namespace App\Http\Controllers;

use App\Http\Requests\Question\StoreQuestionRequest;
use App\Http\Requests\Question\UpdateQuestionRequest;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Question::class);

        $questions = Question::query()
            ->where('created_by', auth()->id())
            ->with('options')
            ->latest('id')
            ->get();

        return response()->json($questions);
    }

    public function store(StoreQuestionRequest $request): JsonResponse
    {
        $this->authorize('create', Question::class);

        $validated = $request->validated();

        $question = DB::transaction(function () use ($validated): Question {
            $question = new Question();
            $question->question_text = $validated['question_text'];
            $question->type = $validated['type'];
            $question->marks = $validated['marks'];
            $question->created_by = auth()->id();
            $question->save();

            $question->options()->createMany($validated['options']);

            return $question->load('options');
        });

        return response()->json($question, 201);
    }

    public function show(Question $question): JsonResponse
    {
        $this->authorize('view', $question);

        return response()->json($question->load('options'));
    }

    public function update(UpdateQuestionRequest $request, Question $question): JsonResponse
    {
        $this->authorize('update', $question);

        $validated = $request->validated();

        $question = DB::transaction(function () use ($question, $validated): Question {
            $question->question_text = $validated['question_text'];
            $question->type = $validated['type'];
            $question->marks = $validated['marks'];
            $question->save();

            $question->options()->delete();
            $question->options()->createMany($validated['options']);

            return $question->load('options');
        });

        return response()->json($question);
    }

    public function destroy(Question $question): JsonResponse
    {
        $this->authorize('delete', $question);

        $question->delete();

        return response()->json([
            'message' => 'question deleted',
        ]);
    }
}
