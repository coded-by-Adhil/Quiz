<?php

namespace App\Services;

use App\Models\Question;
use App\Models\QuizAttempt;
use App\Models\QuizLink;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuizScoringService
{
    /**
     * Score and persist one submission as one atomic operation.
     *
     * @param  array<int, array{question_id: int, option_ids: array<int, int>}>  $submittedAnswers
     */
    public function scoreAndPersist(
        QuizAttempt $attempt,
        QuizLink $link,
        array $submittedAnswers
    ): QuizAttempt {
        return DB::transaction(function () use ($attempt, $link, $submittedAnswers): QuizAttempt {
            $lockedAttempt = QuizAttempt::query()
                ->whereKey($attempt->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedAttempt->submitted_at !== null) {
                $this->fail('attempt', 'This attempt has already been submitted.');
            }

            $durationMinutes = $link->quiz->duration_minutes;

            if (
                $durationMinutes !== null
                && now()->greaterThan(
                    $lockedAttempt->started_at->copy()->addMinutes($durationMinutes)
                )
            ) {
                $this->fail('attempt', 'The time limit has been exceeded.');
            }

            $questions = $link->questions()
                ->with('options')
                ->get();
            $answersByQuestion = $this->indexSubmittedAnswers($submittedAnswers);
            $linkedQuestionIds = $questions->modelKeys();
            $submittedQuestionIds = array_keys($answersByQuestion);
            $foreignQuestionIds = array_diff($submittedQuestionIds, $linkedQuestionIds);

            if ($foreignQuestionIds !== []) {
                $this->fail(
                    'answers',
                    'Every submitted question must belong to this quiz link.'
                );
            }

            $score = 0;

            foreach ($questions as $question) {
                $submittedAnswer = $answersByQuestion[$question->id] ?? null;
                $selectedOptionIds = $submittedAnswer['option_ids'] ?? [];
                $this->validateSelectedOptions($question, $selectedOptionIds);

                $isCorrect = $this->isCorrect($question, $selectedOptionIds);
                $answer = $lockedAttempt->answers()->create([
                    'question_id' => $question->id,
                ]);

                $answer->selectedOptions()->createMany(
                    array_map(
                        fn (int $optionId): array => [
                            'question_option_id' => $optionId,
                        ],
                        $selectedOptionIds
                    )
                );

                if ($isCorrect) {
                    $score += $question->marks;
                }
            }

            $lockedAttempt->score = $score;
            $lockedAttempt->total_marks = $questions->sum('marks');
            $lockedAttempt->submitted_at = now();
            $lockedAttempt->save();

            return $lockedAttempt->load([
                'quizLink.quiz',
                'answers.question.options',
                'answers.selectedOptions.questionOption',
            ]);
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function buildBreakdown(QuizAttempt $attempt): array
    {
        $attempt->loadMissing([
            'answers.question.options',
            'answers.selectedOptions.questionOption',
        ]);

        return $attempt->answers
            ->map(function ($answer): array {
                $question = $answer->question;
                $selectedOptionIds = $answer->selectedOptions
                    ->pluck('question_option_id')
                    ->map(fn ($id): int => (int) $id)
                    ->values()
                    ->all();
                $isCorrect = $this->isCorrect($question, $selectedOptionIds);

                return [
                    'question_id' => $question->id,
                    'question_text' => $question->question_text,
                    'selected_options' => $answer->selectedOptions
                        ->map(fn ($selectedOption): array => [
                            'id' => $selectedOption->questionOption->id,
                            'option_text' => $selectedOption->questionOption->option_text,
                        ])
                        ->values()
                        ->all(),
                    'correct_options' => $question->options
                        ->filter(fn ($option): bool => $option->is_correct)
                        ->map(fn ($option): array => [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                        ])
                        ->values()
                        ->all(),
                    'is_correct' => $isCorrect,
                    'marks' => $question->marks,
                    'awarded_marks' => $isCorrect ? $question->marks : 0,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<int, array{question_id: int, option_ids: array<int, int>}>  $submittedAnswers
     * @return array<int, array{question_id: int, option_ids: array<int, int> }>
     */
    private function indexSubmittedAnswers(array $submittedAnswers): array
    {
        $indexed = [];

        foreach ($submittedAnswers as $submittedAnswer) {
            $questionId = (int) $submittedAnswer['question_id'];

            if (array_key_exists($questionId, $indexed)) {
                $this->fail('answers', 'A question may only be submitted once.');
            }

            $indexed[$questionId] = [
                'question_id' => $questionId,
                'option_ids' => array_map(
                    fn ($optionId): int => (int) $optionId,
                    $submittedAnswer['option_ids']
                ),
            ];
        }

        return $indexed;
    }

    /**
     * @param  list<int>  $selectedOptionIds
     */
    private function validateSelectedOptions(Question $question, array $selectedOptionIds): void
    {
        if ($question->type === 'single' && count($selectedOptionIds) > 1) {
            $this->fail(
                'answers',
                'A single-select question can have at most one selected option.'
            );
        }

        $questionOptionIds = $question->options
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        if (array_diff($selectedOptionIds, $questionOptionIds) !== []) {
            $this->fail(
                'answers',
                'Every selected option must belong to its submitted question.'
            );
        }
    }

    /**
     * @param  list<int>  $selectedOptionIds
     */
    private function isCorrect(Question $question, array $selectedOptionIds): bool
    {
        $correctOptionIds = $question->options
            ->filter(fn ($option): bool => $option->is_correct)
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->sort()
            ->values()
            ->all();
        $selectedOptionIds = collect($selectedOptionIds)
            ->map(fn ($id): int => (int) $id)
            ->sort()
            ->values()
            ->all();

        if ($question->type === 'single') {
            return count($selectedOptionIds) === 1
                && $selectedOptionIds === $correctOptionIds;
        }

        return $selectedOptionIds === $correctOptionIds;
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([
            $field => [$message],
        ]);
    }
}
