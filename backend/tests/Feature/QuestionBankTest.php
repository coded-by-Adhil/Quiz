<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use RuntimeException;
use Tests\TestCase;

class QuestionBankTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_question_and_options_without_client_controlled_ownership(): void
    {
        $admin = $this->authenticateAsAdmin();
        $otherAdmin = User::factory()->create(['role' => 'admin', 'is_approved' => true]);

        $response = $this->postJson('/api/admin/questions', [
            'created_by' => $otherAdmin->id,
            ...$this->singleQuestionPayload(),
        ]);

        $response->assertCreated()
            ->assertJsonPath('created_by', $admin->id)
            ->assertJsonCount(2, 'options');

        $this->assertDatabaseHas('questions', [
            'created_by' => $admin->id,
            'question_text' => 'What is 2 + 2?',
        ]);
        $this->assertDatabaseMissing('questions', [
            'created_by' => $otherAdmin->id,
            'question_text' => 'What is 2 + 2?',
        ]);
        $this->assertDatabaseCount('question_options', 2);
    }

    public function test_question_requires_at_least_two_options(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/admin/questions', [
            'question_text' => 'Invalid question',
            'type' => 'single',
            'marks' => 1,
            'options' => [
                ['option_text' => 'Only option', 'is_correct' => true],
            ],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('options');
        $this->assertDatabaseCount('questions', 0);
    }

    public function test_single_question_requires_exactly_one_correct_option(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/admin/questions', [
            'question_text' => 'Invalid single question',
            'type' => 'single',
            'marks' => 1,
            'options' => [
                ['option_text' => 'Answer A', 'is_correct' => true],
                ['option_text' => 'Answer B', 'is_correct' => true],
            ],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('options')
            ->assertJsonPath('errors.options.0', 'A single question must have exactly one correct option.');
        $this->assertDatabaseCount('questions', 0);
    }

    public function test_multiple_question_requires_at_least_two_correct_options(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/admin/questions', [
            'question_text' => 'Invalid multiple question',
            'type' => 'multiple',
            'marks' => 2,
            'options' => [
                ['option_text' => 'Answer A', 'is_correct' => true],
                ['option_text' => 'Answer B', 'is_correct' => false],
            ],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('options')
            ->assertJsonPath('errors.options.0', 'A multiple question must have at least two correct options.');
        $this->assertDatabaseCount('questions', 0);
    }

    public function test_basic_question_fields_are_validated(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/admin/questions', [
            'question_text' => '',
            'type' => 'unsupported',
            'marks' => 0,
            'options' => [
                ['option_text' => 'A', 'is_correct' => true],
                ['option_text' => 'B', 'is_correct' => false],
            ],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['question_text', 'type', 'marks']);
        $this->assertDatabaseCount('questions', 0);
    }

    public function test_admin_can_list_only_their_questions(): void
    {
        $admin = $this->authenticateAsAdmin();
        $otherAdmin = User::factory()->create(['role' => 'admin', 'is_approved' => true]);

        $ownQuestion = $this->createQuestion($admin, 'Own question');
        $this->createQuestion($otherAdmin, 'Other question');

        $response = $this->getJson('/api/admin/questions');

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $ownQuestion->id)
            ->assertJsonMissing(['question_text' => 'Other question']);
    }

    public function test_admin_can_view_their_question_with_options(): void
    {
        $admin = $this->authenticateAsAdmin();
        $question = $this->createQuestion($admin);

        $this->getJson('/api/admin/questions/'.$question->id)
            ->assertOk()
            ->assertJsonPath('id', $question->id)
            ->assertJsonCount(2, 'options');
    }

    public function test_admin_cannot_view_another_admins_question(): void
    {
        $admin = $this->authenticateAsAdmin();
        $otherAdmin = User::factory()->create(['role' => 'admin', 'is_approved' => true]);
        $question = $this->createQuestion($otherAdmin);

        $this->getJson('/api/admin/questions/'.$question->id)
            ->assertForbidden();

        $this->assertDatabaseHas('questions', ['id' => $question->id]);
        $this->assertNotSame($admin->id, $question->created_by);
    }

    public function test_super_admin_cannot_access_the_question_bank(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'is_approved' => true,
        ]);
        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/admin/questions')->assertForbidden();
        $this->postJson('/api/admin/questions', $this->singleQuestionPayload())
            ->assertForbidden();
    }

    public function test_unauthenticated_users_cannot_access_the_question_bank(): void
    {
        $this->getJson('/api/admin/questions')->assertUnauthorized();
        $this->postJson('/api/admin/questions', $this->singleQuestionPayload())
            ->assertUnauthorized();
    }

    public function test_api_unauthenticated_response_is_json_without_an_accept_header(): void
    {
        $this->get('/api/admin/questions')
            ->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_admin_can_update_a_question_and_replace_its_options(): void
    {
        $admin = $this->authenticateAsAdmin();
        $question = $this->createQuestion($admin);
        $oldOptionIds = $question->options->modelKeys();

        $response = $this->putJson('/api/admin/questions/'.$question->id, [
            'created_by' => User::factory()->create(['role' => 'admin'])->id,
            'question_text' => 'Updated question',
            'type' => 'multiple',
            'marks' => 3,
            'options' => [
                ['option_text' => 'Updated A', 'is_correct' => true],
                ['option_text' => 'Updated B', 'is_correct' => true],
                ['option_text' => 'Updated C', 'is_correct' => false],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('question_text', 'Updated question')
            ->assertJsonPath('created_by', $admin->id)
            ->assertJsonCount(3, 'options');

        foreach ($oldOptionIds as $oldOptionId) {
            $this->assertDatabaseMissing('question_options', ['id' => $oldOptionId]);
        }

        $this->assertDatabaseHas('questions', [
            'id' => $question->id,
            'created_by' => $admin->id,
            'marks' => 3,
        ]);
    }

    public function test_create_rolls_back_when_an_option_cannot_be_saved(): void
    {
        $this->authenticateAsAdmin();
        QuestionOption::creating(function (): void {
            throw new RuntimeException('simulated option write failure');
        });

        $this->withoutExceptionHandling();

        try {
            $this->postJson('/api/admin/questions', $this->singleQuestionPayload());
            $this->fail('The simulated option write failure was not raised.');
        } catch (RuntimeException $exception) {
            $this->assertSame('simulated option write failure', $exception->getMessage());
        } finally {
            QuestionOption::flushEventListeners();
        }

        $this->assertDatabaseCount('questions', 0);
        $this->assertDatabaseCount('question_options', 0);
    }

    public function test_update_rolls_back_question_and_options_when_replacement_fails(): void
    {
        $admin = $this->authenticateAsAdmin();
        $question = $this->createQuestion($admin, 'Original question');
        $oldOptionIds = $question->options->modelKeys();

        QuestionOption::creating(function (): void {
            throw new RuntimeException('simulated option replacement failure');
        });

        $this->withoutExceptionHandling();

        try {
            $this->putJson('/api/admin/questions/'.$question->id, [
                'question_text' => 'Changed question',
                'type' => 'single',
                'marks' => 2,
                'options' => [
                    ['option_text' => 'New A', 'is_correct' => true],
                    ['option_text' => 'New B', 'is_correct' => false],
                ],
            ]);
            $this->fail('The simulated option replacement failure was not raised.');
        } catch (RuntimeException $exception) {
            $this->assertSame('simulated option replacement failure', $exception->getMessage());
        } finally {
            QuestionOption::flushEventListeners();
        }

        $this->assertDatabaseHas('questions', [
            'id' => $question->id,
            'question_text' => 'Original question',
            'marks' => 1,
        ]);

        foreach ($oldOptionIds as $oldOptionId) {
            $this->assertDatabaseHas('question_options', ['id' => $oldOptionId]);
        }
        $this->assertDatabaseMissing('question_options', ['option_text' => 'New A']);
    }

    public function test_admin_can_soft_delete_a_question_and_it_disappears_from_list(): void
    {
        $admin = $this->authenticateAsAdmin();
        $question = $this->createQuestion($admin);

        $this->deleteJson('/api/admin/questions/'.$question->id)
            ->assertOk()
            ->assertJson(['message' => 'question deleted']);

        $this->assertSoftDeleted('questions', ['id' => $question->id]);
        $this->assertDatabaseCount('question_options', 2);

        $this->getJson('/api/admin/questions')
            ->assertOk()
            ->assertJsonMissing(['id' => $question->id]);

        $this->getJson('/api/admin/questions/'.$question->id)
            ->assertNotFound();
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

    /**
     * @return array<string, mixed>
     */
    private function singleQuestionPayload(): array
    {
        return [
            'question_text' => 'What is 2 + 2?',
            'type' => 'single',
            'marks' => 1,
            'options' => [
                ['option_text' => '3', 'is_correct' => false],
                ['option_text' => '4', 'is_correct' => true],
            ],
        ];
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
