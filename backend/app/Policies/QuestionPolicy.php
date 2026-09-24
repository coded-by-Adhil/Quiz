<?php

namespace App\Policies;

use App\Models\Question;
use App\Models\User;

class QuestionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function create(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function view(User $user, Question $question): bool
    {
        return $this->ownsQuestion($user, $question);
    }

    public function update(User $user, Question $question): bool
    {
        return $this->ownsQuestion($user, $question);
    }

    public function delete(User $user, Question $question): bool
    {
        return $this->ownsQuestion($user, $question);
    }

    private function ownsQuestion(User $user, Question $question): bool
    {
        return $user->role === 'admin'
            && $question->created_by === $user->id;
    }
}
