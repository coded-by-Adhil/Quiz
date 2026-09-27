<?php

namespace App\Http\Requests\Quiz;

class StoreQuizRequest extends QuizRequest
{
    /**
     * Quiz creation requires both title and description.
     * Update requests intentionally keep the shared nullable description rule.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_replace(parent::rules(), [
            'title' => ['required', 'string'],
            'description' => ['required', 'string'],
        ]);
    }
}
