<?php

namespace App\Policies;

use App\Models\Quiz;
use App\Models\User;

class QuizPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function create(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function view(User $user, Quiz $quiz): bool
    {
        return $this->ownsQuiz($user, $quiz);
    }

    public function update(User $user, Quiz $quiz): bool
    {
        return $this->ownsQuiz($user, $quiz);
    }

    public function delete(User $user, Quiz $quiz): bool
    {
        return $this->ownsQuiz($user, $quiz);
    }

    private function ownsQuiz(User $user, Quiz $quiz): bool
    {
        return $user->role === 'admin'
            && $quiz->owner_id === $user->id;
    }
}
