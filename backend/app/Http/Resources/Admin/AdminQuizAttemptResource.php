<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminQuizAttemptResource extends JsonResource
{
    /**
     * Admin reporting intentionally exposes aggregate data only.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'participant_name' => $this->participant_name,
            'score' => $this->score,
            'total_marks' => $this->total_marks,
            'submitted_at' => $this->submitted_at,
            'quiz_link_id' => $this->quiz_link_id,
        ];
    }
}
