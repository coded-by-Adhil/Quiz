<?php

namespace App\Http\Requests\QuizLink;

use App\Models\Quiz;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StoreQuizLinkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'question_ids' => ['required', 'array', 'min:1', 'max:10'],
            'question_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('questions', 'id')->where(
                    fn ($query) => $query->whereNull('deleted_at')
                ),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $quiz = $this->route('quiz');
            $questionIds = $this->input('question_ids', []);

            if (! $quiz instanceof Quiz || $questionIds === []) {
                return;
            }

            if (! $quiz->questions()->exists()) {
                $validator->errors()->add(
                    'question_ids',
                    'The quiz must have at least one attached question before a link can be created.'
                );

                return;
            }

            $validQuestionCount = DB::table('questions')
                ->join(
                    'quiz_questions',
                    'questions.id',
                    '=',
                    'quiz_questions.question_id'
                )
                ->where('quiz_questions.quiz_id', $quiz->id)
                ->whereIn('questions.id', $questionIds)
                ->where('questions.created_by', auth()->id())
                ->whereNull('questions.deleted_at')
                ->count('questions.id');

            if ($validQuestionCount !== count($questionIds)) {
                $validator->errors()->add(
                    'question_ids',
                    'Every selected question must belong to the authenticated admin and already be attached to this quiz.'
                );
            }
        });
    }
}
