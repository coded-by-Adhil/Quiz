<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Log;

class RegisterAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        Log::info('Admin registration request received', [
            'method' => $this->method(),
            'path' => $this->path(),
            'email' => $this->input('email'),
            'input_keys' => array_keys($this->except([
                'password',
                'password_confirmation',
            ])),
        ]);

        Log::info('Admin registration validation started');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        Log::error('Admin registration validation failed', [
            'email' => $this->input('email'),
            'errors' => $validator->errors()->toArray(),
            'response_status' => 422,
        ]);

        parent::failedValidation($validator);
    }
}
