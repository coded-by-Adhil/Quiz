<?php

namespace App\Http\Requests\Question;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuestionRequest extends FormRequest
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
            'question_text' => ['required', 'string'],
            'type' => ['required', Rule::in(['single', 'multiple'])],
            'marks' => ['required', 'integer', 'min:1'],
            'options' => ['required', 'array', 'min:2'],
            'options.*.option_text' => ['required', 'string', 'max:255'],
            'options.*.is_correct' => ['required', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $type = $this->input('type');
            $options = $this->input('options');

            if (! in_array($type, ['single', 'multiple'], true) || ! is_array($options)) {
                return;
            }

            $correctOptionCount = collect($options)
                ->filter(fn (mixed $option): bool => is_array($option)
                    && in_array($option['is_correct'] ?? null, [true, 1, '1'], true))
                ->count();

            if ($type === 'single' && $correctOptionCount !== 1) {
                $validator->errors()->add(
                    'options',
                    'A single question must have exactly one correct option.'
                );
            }

            if ($type === 'multiple' && $correctOptionCount < 2) {
                $validator->errors()->add(
                    'options',
                    'A multiple question must have at least two correct options.'
                );
            }
        });
    }
}
