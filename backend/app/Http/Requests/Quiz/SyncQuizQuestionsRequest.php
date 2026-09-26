<?php

namespace App\Http\Requests\Quiz;

use App\Models\Question;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\Rule;

class SyncQuizQuestionsRequest extends QuizRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'question_ids' => ['present', 'array'],
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

            $questionIds = $this->input('question_ids', []);

            if ($questionIds === []) {
                return;
            }

            $ownedQuestionCount = Question::query()
                ->whereIn('id', $questionIds)
                ->where('created_by', auth()->id())
                ->count();

            if ($ownedQuestionCount !== count($questionIds)) {
                $validator->errors()->add(
                    'question_ids',
                    'All questions must belong to the authenticated admin.'
                );
            }
        });
    }
}
