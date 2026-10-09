<?php

namespace App\Http\Requests\Guest;

use Illuminate\Foundation\Http\FormRequest;

class SubmitQuizRequest extends FormRequest
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
            'answers' => ['present', 'array'],
            'answers.*.question_id' => ['required', 'integer', 'distinct'],
            'answers.*.option_ids' => ['present', 'array'],
            'answers.*.option_ids.*' => ['integer', 'distinct'],
        ];
    }
}
