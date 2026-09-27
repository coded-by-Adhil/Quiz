<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizLink;
use App\Models\User;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use RuntimeException;
use Tests\TestCase;

class QuizLinkManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_link_with_an_ordered_question_subset(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $firstQuestion = $this->createQuestion($admin, 'First question');
        $secondQuestion = $this->createQuestion($admin, 'Second question');
        $this->attachQuestions($quiz, [$firstQuestion, $secondQuestion]);

        $response = $this->postJson('/api/admin/quizzes/'.$quiz->id.'/links', [
            'question_ids' => [$secondQuestion->id, $firstQuestion->id],
        ]);

        $response->assertCreated()
            ->assertJsonPath('quiz_id', $quiz->id)
            ->assertJsonPath('is_active', true)
            ->assertJsonPath('questions.0.id', $secondQuestion->id)
            ->assertJsonPath('questions.1.id', $firstQuestion->id);

        $token = $response->json('token');

        $this->assertIsString($token);
        $this->assertSame(40, strlen($token));
        $this->assertDatabaseHas('quiz_links', [
            'quiz_id' => $quiz->id,
            'token' => $token,
            'is_active' => true,
        ]);
        $this->assertDatabaseHas('quiz_link_questions', [
            'question_id' => $secondQuestion->id,
            'order' => 0,
        ]);
        $this->assertDatabaseHas('quiz_link_questions', [
            'question_id' => $firstQuestion->id,
            'order' => 1,
        ]);
    }

    public function test_link_tokens_are_unique_for_multiple_links_on_one_quiz(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $question = $this->createQuestion($admin);
        $this->attachQuestions($quiz, [$question]);

        $firstResponse = $this->postJson('/api/admin/quizzes/'.$quiz->id.'/links', [
            'question_ids' => [$question->id],
        ])->assertCreated();
        $secondResponse = $this->postJson('/api/admin/quizzes/'.$quiz->id.'/links', [
            'question_ids' => [$question->id],
        ])->assertCreated();

        $this->assertNotSame(
            $firstResponse->json('token'),
            $secondResponse->json('token')
        );
        $this->assertDatabaseCount('quiz_links', 2);
    }

    public function test_create_rejects_a_quiz_with_no_attached_questions(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $question = $this->createQuestion($admin);

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/links', [
            'question_ids' => [$question->id],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('question_ids');

        $this->assertDatabaseCount('quiz_links', 0);
        $this->assertDatabaseCount('quiz_link_questions', 0);
    }

    public function test_create_rejects_a_question_owned_by_the_admin_but_not_attached_to_this_quiz(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $attachedQuestion = $this->createQuestion($admin, 'Attached question');
        $unattachedQuestion = $this->createQuestion($admin, 'Unattached question');
        $this->attachQuestions($quiz, [$attachedQuestion]);

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/links', [
            'question_ids' => [$attachedQuestion->id, $unattachedQuestion->id],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('question_ids');

        $this->assertDatabaseCount('quiz_links', 0);
        $this->assertDatabaseCount('quiz_link_questions', 0);
    }

    public function test_create_rejects_another_admins_question_without_partial_creation(): void
    {
        $admin = $this->authenticateAsAdmin();
        $otherAdmin = User::factory()->create([
            'role' => 'admin',
            'is_approved' => true,
        ]);
        $quiz = $this->createQuiz($admin);
        $ownQuestion = $this->createQuestion($admin, 'Own question');
        $otherQuestion = $this->createQuestion($otherAdmin, 'Other admin question');
        $this->attachQuestions($quiz, [$ownQuestion]);

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/links', [
            'question_ids' => [$ownQuestion->id, $otherQuestion->id],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('question_ids');

        $this->assertDatabaseCount('quiz_links', 0);
        $this->assertDatabaseCount('quiz_link_questions', 0);
    }

    public function test_create_rejects_more_than_ten_questions(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $questions = [];

        for ($index = 1; $index <= 11; $index++) {
            $questions[] = $this->createQuestion($admin, 'Question '.$index);
        }

        $this->attachQuestions($quiz, $questions);

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/links', [
            'question_ids' => collect($questions)->pluck('id')->all(),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('question_ids');

        $this->assertDatabaseCount('quiz_links', 0);
        $this->assertDatabaseCount('quiz_link_questions', 0);
    }

    public function test_create_rejects_empty_duplicate_and_invalid_question_id_arrays(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $question = $this->createQuestion($admin);
        $this->attachQuestions($quiz, [$question]);

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/links', [
            'question_ids' => [],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('question_ids');

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/links', [
            'question_ids' => [$question->id, $question->id],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('question_ids.1');

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/links', [
            'question_ids' => [999999],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('question_ids.0');

        $this->assertDatabaseCount('quiz_links', 0);
    }

    public function test_admin_can_list_only_links_for_an_owned_quiz(): void
    {
        $admin = $this->authenticateAsAdmin();
        $otherAdmin = User::factory()->create([
            'role' => 'admin',
            'is_approved' => true,
        ]);
        $quiz = $this->createQuiz($admin, 'Own quiz');
        $ownQuestion = $this->createQuestion($admin);
        $this->attachQuestions($quiz, [$ownQuestion]);
        $ownLink = $this->createLink($quiz, [$ownQuestion]);
        $this->createLink($quiz, [$ownQuestion]);

        $otherQuiz = $this->createQuiz($otherAdmin, 'Other quiz');
        $otherQuestion = $this->createQuestion($otherAdmin);
        $this->attachQuestions($otherQuiz, [$otherQuestion]);
        $otherLink = $this->createLink($otherQuiz, [$otherQuestion]);

        $this->getJson('/api/admin/quizzes/'.$quiz->id.'/links')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['id' => $ownLink->id])
            ->assertJsonMissing(['id' => $otherLink->id]);
    }

    public function test_admin_can_toggle_link_active_state_and_it_persists(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $question = $this->createQuestion($admin);
        $this->attachQuestions($quiz, [$question]);
        $link = $this->createLink($quiz, [$question]);

        $this->patchJson('/api/admin/links/'.$link->id, [
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('id', $link->id)
            ->assertJsonPath('is_active', false);

        $this->assertDatabaseHas('quiz_links', [
            'id' => $link->id,
            'is_active' => false,
        ]);

        $this->getJson('/api/admin/quizzes/'.$quiz->id.'/links')
            ->assertOk()
            ->assertJsonPath('0.is_active', false);

        $this->patchJson('/api/admin/links/'.$link->id, [
            'is_active' => true,
        ])->assertOk()
            ->assertJsonPath('is_active', true);
    }

    public function test_toggle_requires_a_boolean_active_state(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $question = $this->createQuestion($admin);
        $this->attachQuestions($quiz, [$question]);
        $link = $this->createLink($quiz, [$question]);

        $this->patchJson('/api/admin/links/'.$link->id, [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('is_active');

        $this->patchJson('/api/admin/links/'.$link->id, [
            'is_active' => 'not-a-boolean',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('is_active');

        $this->assertDatabaseHas('quiz_links', [
            'id' => $link->id,
            'is_active' => true,
        ]);
    }

    public function test_link_server_fields_cannot_be_forged_from_the_request(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $question = $this->createQuestion($admin);
        $this->attachQuestions($quiz, [$question]);

        $response = $this->postJson('/api/admin/quizzes/'.$quiz->id.'/links', [
            'quiz_id' => 999999,
            'token' => 'forged-token',
            'question_ids' => [$question->id],
        ])->assertCreated();

        $this->assertSame($quiz->id, $response->json('quiz_id'));
        $this->assertNotSame('forged-token', $response->json('token'));
        $this->assertDatabaseMissing('quiz_links', ['token' => 'forged-token']);
    }

    public function test_link_creation_rolls_back_when_pivot_insert_fails(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $question = $this->createQuestion($admin);
        $this->attachQuestions($quiz, [$question]);

        DB::listen(function (QueryExecuted $query): void {
            $sql = strtolower(ltrim($query->sql));

            if (str_starts_with($sql, 'insert into') && str_contains($sql, 'quiz_link_questions')) {
                throw new RuntimeException('simulated link pivot write failure');
            }
        });

        $this->withoutExceptionHandling();

        try {
            $this->postJson('/api/admin/quizzes/'.$quiz->id.'/links', [
                'question_ids' => [$question->id],
            ]);
            $this->fail('The simulated link pivot failure was not raised.');
        } catch (RuntimeException $exception) {
            $this->assertSame('simulated link pivot write failure', $exception->getMessage());
        }

        $this->assertDatabaseCount('quiz_links', 0);
        $this->assertDatabaseCount('quiz_link_questions', 0);
    }

    public function test_unauthenticated_users_cannot_manage_links(): void
    {
        $this->getJson('/api/admin/quizzes/1/links')->assertUnauthorized();
        $this->postJson('/api/admin/quizzes/1/links', [
            'question_ids' => [1],
        ])->assertUnauthorized();
        $this->patchJson('/api/admin/links/1', [
            'is_active' => false,
        ])->assertUnauthorized();
    }

    public function test_super_admin_cannot_list_or_toggle_admin_links(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_approved' => true,
        ]);
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'is_approved' => true,
        ]);
        $quiz = $this->createQuiz($admin);
        $question = $this->createQuestion($admin);
        $this->attachQuestions($quiz, [$question]);
        $link = $this->createLink($quiz, [$question]);

        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/admin/quizzes/'.$quiz->id.'/links')->assertForbidden();
        $this->patchJson('/api/admin/links/'.$link->id, [
            'is_active' => false,
        ])->assertForbidden();
    }

    public function test_admin_cannot_list_or_toggle_another_admins_links(): void
    {
        $admin = $this->authenticateAsAdmin();
        $otherAdmin = User::factory()->create([
            'role' => 'admin',
            'is_approved' => true,
        ]);
        $otherQuiz = $this->createQuiz($otherAdmin);
        $otherQuestion = $this->createQuestion($otherAdmin);
        $this->attachQuestions($otherQuiz, [$otherQuestion]);

        Sanctum::actingAs($otherAdmin);
        $otherLink = $this->createLink($otherQuiz, [$otherQuestion]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/quizzes/'.$otherQuiz->id.'/links')->assertForbidden();
        $this->patchJson('/api/admin/links/'.$otherLink->id, [
            'is_active' => false,
        ])->assertForbidden();

        $this->assertDatabaseHas('quiz_links', [
            'id' => $otherLink->id,
            'is_active' => true,
        ]);
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

    private function createQuiz(User $owner, string $title = 'Sample quiz'): Quiz
    {
        $quiz = new Quiz();
        $quiz->owner_id = $owner->id;
        $quiz->title = $title;
        $quiz->description = 'Quiz description';
        $quiz->duration_minutes = 15;
        $quiz->save();

        return $quiz;
    }

    private function createQuestion(User $owner, string $questionText = 'What is 2 + 2?'): Question
    {
        $question = new Question();
        $question->question_text = $questionText;
        $question->type = 'single';
        $question->marks = 1;
        $question->created_by = $owner->id;
        $question->save();
        $question->options()->createMany([
            ['option_text' => '3', 'is_correct' => false],
            ['option_text' => '4', 'is_correct' => true],
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
    private function createLink(Quiz $quiz, array $questions): QuizLink
    {
        $syncData = [];

        foreach ($questions as $order => $question) {
            $syncData[$question->id] = ['order' => $order];
        }

        $link = new QuizLink();
        $link->quiz_id = $quiz->id;
        $link->token = 'test-token-'.$quiz->id.'-'.uniqid();
        $link->is_active = true;
        $link->save();
        $link->questions()->sync($syncData);

        return $link->fresh();
    }
}
