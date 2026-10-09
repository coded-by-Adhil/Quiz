<?php

namespace App\Http\Resources\SuperAdmin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SuperAdminAdminDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'is_approved' => $this->is_approved,
            'created_at' => $this->created_at,
            'questions_count' => $this->questions_count,
            'quizzes_count' => $this->quizzes_count,
            'quiz_links_count' => $this->quiz_links_count,
        ];
    }
}
