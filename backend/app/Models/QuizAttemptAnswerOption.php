<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttemptAnswerOption extends Model
{
    use HasFactory;

    public $timestamps = false;

    /**
     * The answer relationship is assigned by the server.
     *
     * @var list<string>
     */
    protected $fillable = [
        'question_option_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quiz_attempt_answer_id' => 'integer',
            'question_option_id' => 'integer',
        ];
    }

    public function answer(): BelongsTo
    {
        return $this->belongsTo(QuizAttemptAnswer::class, 'quiz_attempt_answer_id');
    }

    public function questionOption(): BelongsTo
    {
        return $this->belongsTo(QuestionOption::class);
    }
}
