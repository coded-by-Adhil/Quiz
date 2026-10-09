<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GuestQuizFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_link_returns_quiz_metadata_without_questions(): void
    {
        [$quiz, $link] = $this->quizWithLink();

        $this->getJson('/api/quiz/'.$link->token)
            ->assertOk()
            ->assertExactJson([
                'title' => $quiz->title,
                'description' => $quiz->description,
                'duration_minutes' => $quiz->duration_minutes,
            ]);
    }

    public function test_inactive_link_returns_forbidden_for_public_access(): void
    {
        [, $link] = $this->quizWithLink(false);

        $this->getJson('/api/quiz/'.$link->token)
            ->assertForbidden()
            ->assertJson(['message' => 'This quiz link is no longer available.']);

        $this->postJson('/api/quiz/'.$link->token.'/start', [
            'participant_name' => 'Guest',
        ])->assertForbidden();
    }

    public function test_start_creates_uuid_attempt_and_hides_correctness(): void
    {
        [$quiz, $link] = $this->quizWithLink();

        $response = $this->postJson('/api/quiz/'.$link->token.'/start', [
            'participant_name' => 'Taylor Guest',
        ]);

        $response->assertCreated()
            ->assertJsonPath('participant_name', 'Taylor Guest')
            ->assertJsonPath('duration_minutes', $quiz->duration_minutes)
            ->assertJsonMissingPath('questions.0.options.0.is_correct');

        $attemptId = $response->json('attempt_id');

        $this->assertTrue(Str::isUuid($attemptId));
        $this->assertDatabaseHas('quiz_attempts', [
            'id' => $attemptId,
            'quiz_link_id' => $link->id,
            'participant_name' => 'Taylor Guest',
            'total_marks' => 1,
            'score' => null,
        ]);
        $this->assertStringNotContainsString('is_correct', $response->getContent());
    }

    public function test_start_requires_a_participant_name(): void
    {
        [, $link] = $this->quizWithLink();

        $this->postJson('/api/quiz/'.$link->token.'/start', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('participant_name');
    }

    public function test_submit_scores_single_multiple_and_unanswered_questions(): void
    {
        [$quiz, $link, $questions] = $this->quizWithLinkAndQuestions();
        $startResponse = $this->postJson('/api/quiz/'.$link->token.'/start', [
            'participant_name' => 'Scoring Guest',
        ])->assertCreated();
        $attemptId = $startResponse->json('attempt_id');

        $submitResponse = $this->postJson(
            '/api/quiz/'.$link->token.'/attempts/'.$attemptId.'/submit',
            [
                'answers' => [
                    [
                        'question_id' => $questions['single']->id,
                        'option_ids' => [$questions['single_correct']->id],
                    ],
                    [
                        'question_id' => $questions['multiple']->id,
                        'option_ids' => [
                            $questions['multiple_correct_a']->id,
                            $questions['multiple_correct_b']->id,
                        ],
                    ],
                ],
                'score' => 999,
                'is_correct' => true,
            ]
        );

        $submitResponse->assertOk()
            ->assertJsonPath('attempt_id', $attemptId)
            ->assertJsonPath('score', 3)
            ->assertJsonPath('total_marks', $quiz->questions->sum('marks'));

        $attempt = QuizAttempt::findOrFail($attemptId);
        $this->assertSame(3, $attempt->score);
        $this->assertNotNull($attempt->submitted_at);
        $this->assertDatabaseCount('quiz_attempt_answers', 3);
        $this->assertDatabaseCount('quiz_attempt_answer_options', 3);

        $this->getJson('/api/quiz/'.$link->token.'/attempts/'.$attemptId.'/result')
            ->assertOk()
            ->assertJsonPath('score', 3)
            ->assertJsonPath('total_marks', 6)
            ->assertJsonPath('breakdown.0.is_correct', true)
            ->assertJsonPath('breakdown.0.awarded_marks', 1)
            ->assertJsonPath('breakdown.1.is_correct', true)
            ->assertJsonPath('breakdown.1.awarded_marks', 2)
            ->assertJsonPath('breakdown.2.is_correct', false)
            ->assertJsonPath('breakdown.2.awarded_marks', 0)
            ->assertJsonPath('breakdown.0.correct_options.0.id', $questions['single_correct']->id);
    }

    public function test_multiple_selection_requires_an_exact_correct_set(): void
    {
        $admin = $this->createAdmin();
        $quiz = $this->createQuiz($admin, 30);
        $question = $this->createQuestion($admin, 'multiple', 4, [
            ['option_text' => 'A', 'is_correct' => true],
            ['option_text' => 'B', 'is_correct' => true],
            ['option_text' => 'C', 'is_correct' => false],
        ]);
        $this->attachQuestions($quiz, [$question]);
        $link = $this->createLink($quiz, [$question]);
        $attemptId = $this->startAttempt($link, 'Exact Set Guest');

        $this->postJson('/api/quiz/'.$link->token.'/attempts/'.$attemptId.'/submit', [
            'answers' => [[
                'question_id' => $question->id,
                'option_ids' => [$question->options[0]->id],
            ]],
        ])->assertOk()
            ->assertJsonPath('score', 0)
            ->assertJsonPath('total_marks', 4);
    }

    public function test_duplicate_submission_is_rejected_without_new_answers(): void
    {
        [, $link, $questions] = $this->quizWithLinkAndQuestions();
        $attemptId = $this->startAttempt($link, 'Duplicate Guest');
        $payload = [
            'answers' => [[
                'question_id' => $questions['single']->id,
                'option_ids' => [$questions['single_correct']->id],
            ]],
        ];

        $this->postJson('/api/quiz/'.$link->token.'/attempts/'.$attemptId.'/submit', $payload)
            ->assertOk();
        $this->assertDatabaseCount('quiz_attempt_answers', 3);

        $this->postJson('/api/quiz/'.$link->token.'/attempts/'.$attemptId.'/submit', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('attempt');

        $this->assertDatabaseCount('quiz_attempt_answers', 3);
    }

    public function test_submission_after_duration_is_rejected_without_scoring(): void
    {
        $admin = $this->createAdmin();
        $quiz = $this->createQuiz($admin, 1);
        $question = $this->createQuestion($admin);
        $this->attachQuestions($quiz, [$question]);
        $link = $this->createLink($quiz, [$question]);
        $attemptId = $this->startAttempt($link, 'Late Guest');

        $attempt = QuizAttempt::findOrFail($attemptId);
        $attempt->started_at = now()->subMinutes(2);
        $attempt->save();

        $this->postJson('/api/quiz/'.$link->token.'/attempts/'.$attemptId.'/submit', [
            'answers' => [[
                'question_id' => $question->id,
                'option_ids' => [$question->options[1]->id],
            ]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('attempt');

        $this->assertDatabaseHas('quiz_attempts', [
            'id' => $attemptId,
            'score' => null,
            'submitted_at' => null,
        ]);
        $this->assertDatabaseCount('quiz_attempt_answers', 0);
    }

    public function test_submission_rejects_questions_and_options_outside_the_link(): void
    {
        $admin = $this->createAdmin();
        $quiz = $this->createQuiz($admin, null);
        $linkedQuestion = $this->createQuestion($admin, 'single');
        $outsideQuestion = $this->createQuestion($admin, 'single');
        $this->attachQuestions($quiz, [$linkedQuestion]);
        $link = $this->createLink($quiz, [$linkedQuestion]);
        $attemptId = $this->startAttempt($link, 'Boundary Guest');

        $this->postJson('/api/quiz/'.$link->token.'/attempts/'.$attemptId.'/submit', [
            'answers' => [[
                'question_id' => $outsideQuestion->id,
                'option_ids' => [$outsideQuestion->options[1]->id],
            ]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('answers');

        $this->postJson('/api/quiz/'.$link->token.'/attempts/'.$attemptId.'/submit', [
            'answers' => [[
                'question_id' => $linkedQuestion->id,
                'option_ids' => [$outsideQuestion->options[1]->id],
            ]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('answers');

        $this->assertDatabaseCount('quiz_attempt_answers', 0);
    }

    public function test_single_question_rejects_multiple_selected_options(): void
    {
        $admin = $this->createAdmin();
        $quiz = $this->createQuiz($admin, null);
        $question = $this->createQuestion($admin, 'single');
        $this->attachQuestions($quiz, [$question]);
        $link = $this->createLink($quiz, [$question]);
        $attemptId = $this->startAttempt($link, 'Malformed Guest');

        $this->postJson('/api/quiz/'.$link->token.'/attempts/'.$attemptId.'/submit', [
            'answers' => [[
                'question_id' => $question->id,
                'option_ids' => [$question->options[0]->id, $question->options[1]->id],
            ]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('answers');
    }

    public function test_result_is_not_available_before_submission_or_through_another_link(): void
    {
        $admin = $this->createAdmin();
        $quiz = $this->createQuiz($admin, null);
        $question = $this->createQuestion($admin);
        $this->attachQuestions($quiz, [$question]);
        $firstLink = $this->createLink($quiz, [$question]);
        $secondLink = $this->createLink($quiz, [$question]);
        $attemptId = $this->startAttempt($firstLink, 'Private Result Guest');

        $this->getJson('/api/quiz/'.$firstLink->token.'/attempts/'.$attemptId.'/result')
            ->assertNotFound();
        $this->getJson('/api/quiz/'.$secondLink->token.'/attempts/'.$attemptId.'/result')
            ->assertNotFound();
        $this->postJson('/api/quiz/'.$secondLink->token.'/attempts/'.$attemptId.'/submit', [
            'answers' => [],
        ])->assertNotFound();
    }

    public function test_multiple_attempts_are_allowed_on_one_link(): void
    {
        [, $link] = $this->quizWithLink();

        $firstAttempt = $this->startAttempt($link, 'Repeat Guest');
        $secondAttempt = $this->startAttempt($link, 'Repeat Guest');

        $this->assertTrue(Str::isUuid($firstAttempt));
        $this->assertTrue(Str::isUuid($secondAttempt));
        $this->assertNotSame($firstAttempt, $secondAttempt);
        $this->assertDatabaseCount('quiz_attempts', 2);
    }

    public function test_start_is_rate_limited_per_ip(): void
    {
        [, $link] = $this->quizWithLink();

        for ($index = 1; $index <= 10; $index++) {
            $this->postJson('/api/quiz/'.$link->token.'/start', [
                'participant_name' => 'Rate Guest '.$index,
            ])->assertCreated();
        }

        $this->postJson('/api/quiz/'.$link->token.'/start', [
            'participant_name' => 'Rate Guest 11',
        ])->assertTooManyRequests();
    }

    public function test_public_guest_endpoints_do_not_require_sanctum(): void
    {
        [, $link] = $this->quizWithLink();

        Auth::forgetGuards();
        $this->assertGuest();
        $this->getJson('/api/quiz/'.$link->token)->assertOk();
    }

    private function createAdmin(): User
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_approved' => true,
        ]);

        Sanctum::actingAs($admin);

        return $admin;
    }

    /**
     * @return array{0: Quiz, 1: QuizLink}
     */
    private function quizWithLink(bool $active = true): array
    {
        $admin = $this->createAdmin();
        $quiz = $this->createQuiz($admin, 30);
        $question = $this->createQuestion($admin);
        $this->attachQuestions($quiz, [$question]);
        $link = $this->createLink($quiz, [$question], $active);

        return [$quiz, $link];
    }

    /**
     * @return array{0: Quiz, 1: QuizLink, 2: array<string, Question>}
     */
    private function quizWithLinkAndQuestions(): array
    {
        $admin = $this->createAdmin();
        $quiz = $this->createQuiz($admin, 30);
        $single = $this->createQuestion($admin, 'single', 1);
        $multiple = $this->createQuestion($admin, 'multiple', 2, [
            ['option_text' => 'A', 'is_correct' => true],
            ['option_text' => 'B', 'is_correct' => true],
            ['option_text' => 'C', 'is_correct' => false],
        ]);
        $unanswered = $this->createQuestion($admin, 'single', 3);
        $this->attachQuestions($quiz, [$single, $multiple, $unanswered]);
        $link = $this->createLink($quiz, [$single, $multiple, $unanswered]);

        return [
            $quiz->load('questions'),
            $link,
            [
                'single' => $single,
                'single_correct' => $single->options[1],
                'multiple' => $multiple,
                'multiple_correct_a' => $multiple->options[0],
                'multiple_correct_b' => $multiple->options[1],
                'unanswered' => $unanswered,
            ],
        ];
    }

    private function createQuiz(User $owner, ?int $durationMinutes, string $title = 'Guest quiz'): Quiz
    {
        $quiz = new Quiz();
        $quiz->owner_id = $owner->id;
        $quiz->title = $title;
        $quiz->description = 'Guest quiz description';
        $quiz->duration_minutes = $durationMinutes;
        $quiz->save();

        return $quiz;
    }

    /**
     * @param  list<array{option_text: string, is_correct: bool}>|null  $options
     */
    private function createQuestion(
        User $owner,
        string $type = 'single',
        int $marks = 1,
        ?array $options = null
    ): Question {
        $question = new Question();
        $question->question_text = 'Guest question '.$type.' '.Str::random(8);
        $question->type = $type;
        $question->marks = $marks;
        $question->created_by = $owner->id;
        $question->save();
        $question->options()->createMany($options ?? [
            ['option_text' => 'Wrong', 'is_correct' => false],
            ['option_text' => 'Correct', 'is_correct' => true],
        ]);

        return $question->load('options');
    }

    /**
     * @param  list<Question>  $questions
     */
    private function attachQuestions(Quiz $quiz, array $questions): void
    {
        $syncData = [];

        foreach ($questions as $order => $question) {
            $syncData[$question->id] = ['order' => $order];
        }

        $quiz->questions()->sync($syncData);
    }

    /**
     * @param  list<Question>  $questions
     */
    private function createLink(Quiz $quiz, array $questions, bool $active = true): QuizLink
    {
        $syncData = [];

        foreach ($questions as $order => $question) {
            $syncData[$question->id] = ['order' => $order];
        }

        $link = new QuizLink();
        $link->quiz_id = $quiz->id;
        $link->token = Str::random(40);
        $link->is_active = $active;
        $link->save();
        $link->questions()->sync($syncData);

        return $link->fresh();
    }

    private function startAttempt(QuizLink $link, string $participantName): string
    {
        return $this->postJson('/api/quiz/'.$link->token.'/start', [
            'participant_name' => $participantName,
        ])->assertCreated()->json('attempt_id');
    }
}
