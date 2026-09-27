<?php

namespace App\Policies;

use App\Models\Quiz;
use App\Models\QuizLink;
use App\Models\User;

class QuizLinkPolicy
{
    public function viewAny(User $user, Quiz $quiz): bool
    {
        return $this->ownsQuiz($user, $quiz);
    }

    public function create(User $user, Quiz $quiz): bool
    {
        return $this->ownsQuiz($user, $quiz);
    }

    public function view(User $user, QuizLink $quizLink): bool
    {
        return $this->ownsQuiz($user, $quizLink->quiz);
    }

    public function update(User $user, QuizLink $quizLink): bool
    {
        return $this->ownsQuiz($user, $quizLink->quiz);
    }

    private function ownsQuiz(User $user, Quiz $quiz): bool
    {
        return $user->role === 'admin'
            && $quiz->owner_id === $user->id;
    }
}
