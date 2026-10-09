<?php

namespace App\Http\Resources\Guest;

use App\Services\QuizScoringService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizAttemptResultResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'attempt_id' => $this->id,
            'participant_name' => $this->participant_name,
            'score' => $this->score,
            'total_marks' => $this->total_marks,
            'submitted_at' => $this->submitted_at,
            'breakdown' => app(QuizScoringService::class)->buildBreakdown($this->resource),
        ];
    }
}
