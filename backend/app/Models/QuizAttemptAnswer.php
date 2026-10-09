<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizAttemptAnswer extends Model
{
    use HasFactory;

    /**
     * The attempt relationship is assigned by the server.
     *
     * @var list<string>
     */
    protected $fillable = [
        'question_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quiz_attempt_id' => 'string',
            'question_id' => 'integer',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(QuizAttempt::class, 'quiz_attempt_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function selectedOptions(): HasMany
    {
        return $this->hasMany(QuizAttemptAnswerOption::class);
    }
}
