<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\QuizAttemptAnswerOption;
use App\Models\QuizLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminReportingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_search_and_paginate_only_their_quizzes(): void
    {
        $admin = $this->authenticateAsAdmin();
        $otherAdmin = User::factory()->create([
            'role' => 'admin',
            'is_approved' => true,
        ]);

        for ($index = 1; $index <= 16; $index++) {
            $this->createQuiz($admin, sprintf('Alpha quiz %02d', $index));
        }

        $this->createQuiz($otherAdmin, 'Alpha quiz owned by another admin');

        $response = $this->getJson('/api/admin/quizzes?search=Alpha&sort=title&direction=asc');

        $response->assertOk()
            ->assertJsonPath('meta.total', 16)
            ->assertJsonPath('meta.per_page', 15)
            ->assertJsonCount(15, 'data')
            ->assertJsonPath('data.0.title', 'Alpha quiz 01')
            ->assertJsonMissing(['title' => 'Alpha quiz owned by another admin']);
    }

    public function test_admin_can_search_and_sort_submitted_attempts_without_answer_data(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin, 'Reporting quiz');
        $link = $this->createLink($quiz);

        $highest = $this->createAttempt($link, 'Zara Participant', 9, true);
        $lower = $this->createAttempt($link, 'Alice Participant', 3, true);
        $inProgress = $this->createAttempt($link, 'Alice In Progress', null, false);
        $this->addPersistedAnswerDetail($inProgress, $admin);

        $response = $this->getJson(
            '/api/admin/quizzes/'.$quiz->id.'/attempts?search=Participant&sort=score&direction=desc'
        );

        $response->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.participant_name', 'Zara Participant')
            ->assertJsonPath('data.0.score', 9)
            ->assertJsonPath('data.0.total_marks', 10)
            ->assertJsonPath('data.0.quiz_link_id', $link->id)
            ->assertJsonPath('data.1.participant_name', 'Alice Participant')
            ->assertJsonMissingPath('data.0.answers')
            ->assertJsonMissingPath('data.0.options')
            ->assertJsonMissingPath('data.0.breakdown')
            ->assertJsonMissing(['participant_name' => 'Alice In Progress']);

        $this->assertNotNull($highest->submitted_at);
        $this->assertNotNull($lower->submitted_at);
    }

    public function test_reporting_returns_historical_attempts_for_an_owned_deleted_quiz(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin, 'Historical quiz');
        $link = $this->createLink($quiz);
        $this->createAttempt($link, 'Historical Participant', 4, true);

        $quiz->delete();

        $this->getJson('/api/admin/quizzes/'.$quiz->id.'/attempts')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.participant_name', 'Historical Participant');
    }

    public function test_admin_cannot_view_attempts_for_another_admins_quiz(): void
    {
        $this->authenticateAsAdmin();
        $otherAdmin = User::factory()->create([
            'role' => 'admin',
            'is_approved' => true,
        ]);
        $quiz = $this->createQuiz($otherAdmin, 'Private reporting quiz');

        $this->getJson('/api/admin/quizzes/'.$quiz->id.'/attempts')
            ->assertForbidden();
    }

    public function test_reporting_query_parameters_are_validated(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);

        $this->getJson('/api/admin/quizzes?sort=owner_id')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sort');

        $this->getJson('/api/admin/quizzes/'.$quiz->id.'/attempts?sort=answers')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sort');
    }

    private function authenticateAsAdmin(): User
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_approved' => true,
        ]);

        Sanctum::actingAs($admin);

        return $admin;
    }

    private function createQuiz(User $owner, string $title = 'Reporting test quiz'): Quiz
    {
        $quiz = new Quiz();
        $quiz->owner_id = $owner->id;
        $quiz->title = $title;
        $quiz->description = 'Reporting test quiz';
        $quiz->duration_minutes = 15;
        $quiz->save();

        return $quiz;
    }

    private function createLink(Quiz $quiz): QuizLink
    {
        $link = new QuizLink();
        $link->quiz_id = $quiz->id;
        $link->token = Str::random(40);
        $link->is_active = true;
        $link->save();

        return $link;
    }

    private function createAttempt(
        QuizLink $link,
        string $participantName,
        ?int $score,
        bool $submitted
    ): QuizAttempt {
        $attempt = new QuizAttempt();
        $attempt->quiz_link_id = $link->id;
        $attempt->participant_name = $participantName;
        $attempt->started_at = now()->subMinutes(5);
        $attempt->submitted_at = $submitted ? now()->subMinute() : null;
        $attempt->score = $score;
        $attempt->total_marks = 10;
        $attempt->save();

        return $attempt;
    }

    private function addPersistedAnswerDetail(QuizAttempt $attempt, User $owner): void
    {
        $question = new Question();
        $question->created_by = $owner->id;
        $question->question_text = 'Private answer detail';
        $question->type = 'single';
        $question->marks = 1;
        $question->save();

        $option = $question->options()->create([
            'option_text' => 'Selected option',
            'is_correct' => true,
        ]);

        $answer = new QuizAttemptAnswer();
        $answer->quiz_attempt_id = $attempt->id;
        $answer->question_id = $question->id;
        $answer->save();

        $selectedOption = new QuizAttemptAnswerOption();
        $selectedOption->quiz_attempt_answer_id = $answer->id;
        $selectedOption->question_option_id = $option->id;
        $selectedOption->save();
    }
}
