<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Question extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Fields that may be assigned from a validated request.
     * created_by is assigned only from the authenticated user.
     *
     * @var list<string>
     */
    protected $fillable = [
        'question_text',
        'type',
        'marks',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_by' => 'integer',
            'marks' => 'integer',
        ];
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
