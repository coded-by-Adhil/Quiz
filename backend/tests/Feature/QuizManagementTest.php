<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use RuntimeException;
use Tests\TestCase;

class QuizManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_quiz_without_client_controlled_ownership(): void
    {
        $admin = $this->authenticateAsAdmin();
        $otherAdmin = User::factory()->create(['role' => 'admin', 'is_approved' => true]);

        $response = $this->postJson('/api/admin/quizzes', [
            'owner_id' => $otherAdmin->id,
            'title' => 'General Knowledge',
            'description' => 'A short quiz',
            'duration_minutes' => 20,
            'question_ids' => [9999],
        ]);

        $response->assertCreated()
            ->assertJsonPath('owner_id', $admin->id)
            ->assertJsonPath('title', 'General Knowledge')
            ->assertJsonPath('description', 'A short quiz')
            ->assertJsonPath('duration_minutes', 20)
            ->assertJsonCount(0, 'questions');

        $this->assertDatabaseHas('quizzes', [
            'owner_id' => $admin->id,
            'title' => 'General Knowledge',
        ]);
        $this->assertDatabaseMissing('quizzes', ['owner_id' => $otherAdmin->id]);
        $this->assertDatabaseCount('quiz_questions', 0);
    }

    public function test_quiz_description_and_duration_can_be_null(): void
    {
        $admin = $this->authenticateAsAdmin();

        $this->postJson('/api/admin/quizzes', [
            'title' => 'Untimed quiz',
            'description' => null,
            'duration_minutes' => null,
        ])->assertCreated();

        $this->assertDatabaseHas('quizzes', [
            'owner_id' => $admin->id,
            'description' => null,
            'duration_minutes' => null,
        ]);
    }

    public function test_quiz_fields_are_validated(): void
    {
        $this->authenticateAsAdmin();

        $this->postJson('/api/admin/quizzes', [
            'description' => 'Missing title',
            'duration_minutes' => 0,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'duration_minutes']);

        $this->assertDatabaseCount('quizzes', 0);
    }

    public function test_unauthenticated_users_cannot_access_quizzes(): void
    {
        $this->getJson('/api/admin/quizzes')->assertUnauthorized();
        $this->postJson('/api/admin/quizzes', ['title' => 'Blocked'])->assertUnauthorized();
    }

    public function test_super_admin_cannot_manage_quizzes(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'is_approved' => true,
        ]);
        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/admin/quizzes')->assertForbidden();
        $this->postJson('/api/admin/quizzes', ['title' => 'Blocked'])->assertForbidden();
    }

    public function test_admin_can_list_only_their_non_deleted_quizzes(): void
    {
        $admin = $this->authenticateAsAdmin();
        $otherAdmin = User::factory()->create(['role' => 'admin', 'is_approved' => true]);

        $ownQuiz = $this->createQuiz($admin, 'Own quiz');
        $deletedQuiz = $this->createQuiz($admin, 'Deleted quiz');
        $deletedQuiz->delete();
        $this->createQuiz($otherAdmin, 'Other admin quiz');

        $this->getJson('/api/admin/quizzes')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $ownQuiz->id)
            ->assertJsonMissing(['title' => 'Deleted quiz'])
            ->assertJsonMissing(['title' => 'Other admin quiz']);
    }

    public function test_admin_can_view_own_quiz_with_ordered_questions_and_options(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin, 'Ordered quiz');
        $firstQuestion = $this->createQuestion($admin, 'First question');
        $secondQuestion = $this->createQuestion($admin, 'Second question');

        $quiz->questions()->sync([
            $secondQuestion->id => ['order' => 0],
            $firstQuestion->id => ['order' => 1],
        ]);

        $this->getJson('/api/admin/quizzes/'.$quiz->id)
            ->assertOk()
            ->assertJsonPath('id', $quiz->id)
            ->assertJsonPath('questions.0.id', $secondQuestion->id)
            ->assertJsonPath('questions.1.id', $firstQuestion->id)
            ->assertJsonCount(2, 'questions.0.options');
    }

    public function test_admin_cannot_view_update_or_delete_another_admins_quiz(): void
    {
        $admin = $this->authenticateAsAdmin();
        $otherAdmin = User::factory()->create(['role' => 'admin', 'is_approved' => true]);
        $quiz = $this->createQuiz($otherAdmin, 'Private quiz');

        $this->getJson('/api/admin/quizzes/'.$quiz->id)->assertForbidden();
        $this->putJson('/api/admin/quizzes/'.$quiz->id, ['title' => 'Changed'])->assertForbidden();
        $this->deleteJson('/api/admin/quizzes/'.$quiz->id)->assertForbidden();

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz->id,
            'owner_id' => $otherAdmin->id,
            'title' => 'Private quiz',
        ]);
        $this->assertNotSame($admin->id, $otherAdmin->id);
    }

    public function test_admin_can_update_own_quiz_without_changing_ownership_or_questions(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin, 'Original title');
        $question = $this->createQuestion($admin);
        $quiz->questions()->attach($question->id, ['order' => 0]);

        $this->putJson('/api/admin/quizzes/'.$quiz->id, [
            'owner_id' => User::factory()->create(['role' => 'admin'])->id,
            'title' => 'Updated title',
            'description' => 'Updated description',
            'duration_minutes' => 30,
            'question_ids' => [],
        ])->assertOk()
            ->assertJsonPath('owner_id', $admin->id)
            ->assertJsonPath('title', 'Updated title')
            ->assertJsonCount(1, 'questions');

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz->id,
            'owner_id' => $admin->id,
            'title' => 'Updated title',
            'duration_minutes' => 30,
        ]);
        $this->assertDatabaseHas('quiz_questions', [
            'quiz_id' => $quiz->id,
            'question_id' => $question->id,
            'order' => 0,
        ]);
    }

    public function test_admin_can_sync_own_questions_and_array_order_is_persisted(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $firstQuestion = $this->createQuestion($admin, 'First question');
        $secondQuestion = $this->createQuestion($admin, 'Second question');
        $thirdQuestion = $this->createQuestion($admin, 'Third question');

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/questions', [
            'question_ids' => [$thirdQuestion->id, $firstQuestion->id, $secondQuestion->id],
        ])->assertOk()
            ->assertJsonPath('questions.0.id', $thirdQuestion->id)
            ->assertJsonPath('questions.1.id', $firstQuestion->id)
            ->assertJsonPath('questions.2.id', $secondQuestion->id);

        $this->assertDatabaseHas('quiz_questions', [
            'quiz_id' => $quiz->id,
            'question_id' => $thirdQuestion->id,
            'order' => 0,
        ]);
        $this->assertDatabaseHas('quiz_questions', [
            'quiz_id' => $quiz->id,
            'question_id' => $firstQuestion->id,
            'order' => 1,
        ]);
        $this->assertDatabaseHas('quiz_questions', [
            'quiz_id' => $quiz->id,
            'question_id' => $secondQuestion->id,
            'order' => 2,
        ]);
    }

    public function test_sync_replaces_the_existing_question_set_and_empty_array_clears_it(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $firstQuestion = $this->createQuestion($admin, 'First question');
        $secondQuestion = $this->createQuestion($admin, 'Second question');

        $quiz->questions()->sync([
            $firstQuestion->id => ['order' => 0],
            $secondQuestion->id => ['order' => 1],
        ]);

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/questions', [
            'question_ids' => [$secondQuestion->id],
        ])->assertOk();

        $this->assertDatabaseMissing('quiz_questions', [
            'quiz_id' => $quiz->id,
            'question_id' => $firstQuestion->id,
        ]);
        $this->assertDatabaseHas('quiz_questions', [
            'quiz_id' => $quiz->id,
            'question_id' => $secondQuestion->id,
            'order' => 0,
        ]);

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/questions', [
            'question_ids' => [],
        ])->assertOk()
            ->assertJsonCount(0, 'questions');

        $this->assertDatabaseCount('quiz_questions', 0);
    }

    public function test_sync_rejects_another_admins_question_without_changing_existing_assignments(): void
    {
        $admin = $this->authenticateAsAdmin();
        $otherAdmin = User::factory()->create(['role' => 'admin', 'is_approved' => true]);
        $quiz = $this->createQuiz($admin);
        $ownQuestion = $this->createQuestion($admin, 'Own question');
        $otherQuestion = $this->createQuestion($otherAdmin, 'Other question');
        $quiz->questions()->attach($ownQuestion->id, ['order' => 0]);

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/questions', [
            'question_ids' => [$ownQuestion->id, $otherQuestion->id],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('question_ids');

        $this->assertDatabaseHas('quiz_questions', [
            'quiz_id' => $quiz->id,
            'question_id' => $ownQuestion->id,
            'order' => 0,
        ]);
        $this->assertDatabaseMissing('quiz_questions', [
            'quiz_id' => $quiz->id,
            'question_id' => $otherQuestion->id,
        ]);
    }

    public function test_sync_rejects_duplicate_missing_and_soft_deleted_question_ids(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $question = $this->createQuestion($admin);
        $deletedQuestion = $this->createQuestion($admin, 'Deleted question');
        $deletedQuestion->delete();

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/questions', [
            'question_ids' => [$question->id, $question->id],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('question_ids.1');

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/questions', [
            'question_ids' => [$deletedQuestion->id],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('question_ids.0');

        $this->postJson('/api/admin/quizzes/'.$quiz->id.'/questions', [
            'question_ids' => [999999],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('question_ids.0');

        $this->assertDatabaseCount('quiz_questions', 0);
    }

    public function test_sync_rolls_back_if_the_pivot_insert_fails(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $question = $this->createQuestion($admin);

        DB::listen(function (QueryExecuted $query): void {
            $sql = strtolower(ltrim($query->sql));

            if (str_starts_with($sql, 'insert into') && str_contains($sql, 'quiz_questions')) {
                throw new RuntimeException('simulated pivot write failure');
            }
        });

        $this->withoutExceptionHandling();

        try {
            $this->postJson('/api/admin/quizzes/'.$quiz->id.'/questions', [
                'question_ids' => [$question->id],
            ]);
            $this->fail('The simulated pivot write failure was not raised.');
        } catch (RuntimeException $exception) {
            $this->assertSame('simulated pivot write failure', $exception->getMessage());
        }

        $this->assertDatabaseCount('quiz_questions', 0);
    }

    public function test_admin_can_soft_delete_own_quiz_and_it_disappears_from_the_list(): void
    {
        $admin = $this->authenticateAsAdmin();
        $quiz = $this->createQuiz($admin);
        $question = $this->createQuestion($admin);
        $quiz->questions()->attach($question->id, ['order' => 0]);

        $this->deleteJson('/api/admin/quizzes/'.$quiz->id)
            ->assertOk()
            ->assertJson(['message' => 'quiz deleted']);

        $this->assertSoftDeleted('quizzes', ['id' => $quiz->id]);
        $this->assertDatabaseHas('quiz_questions', [
            'quiz_id' => $quiz->id,
            'question_id' => $question->id,
        ]);
        $this->getJson('/api/admin/quizzes')
            ->assertOk()
            ->assertJsonMissing(['id' => $quiz->id]);
        $this->getJson('/api/admin/quizzes/'.$quiz->id)->assertNotFound();
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
}
