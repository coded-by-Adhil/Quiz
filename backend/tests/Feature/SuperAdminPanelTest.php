<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SuperAdminPanelTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_admin_is_rejected_from_every_super_admin_endpoint(): void
    {
        $admin = $this->createAdmin('regular@example.test', true);
        Sanctum::actingAs($admin);

        $this->getJson('/api/superadmin/stats')->assertForbidden();
        $this->getJson('/api/superadmin/admins')->assertForbidden();
        $this->getJson('/api/superadmin/admins/'.$admin->id)->assertForbidden();
        $this->patchJson('/api/superadmin/admins/'.$admin->id, [
            'is_approved' => false,
        ])->assertForbidden();
    }

    public function test_stats_return_platform_counts_without_counting_deleted_quizzes_or_super_admins(): void
    {
        $superAdmin = $this->createSuperAdmin('super@example.test');
        $approvedAdmin = $this->createAdmin('approved@example.test', true);
        $pendingAdmin = $this->createAdmin('pending@example.test', false);
        $this->createAdmin('deleted-admin@example.test', true);

        $activeQuiz = $this->createQuiz($approvedAdmin, 'Active quiz');
        $activeLink = $this->createLink($activeQuiz);
        $this->createSubmittedAttempt($activeLink, 5);

        $deletedQuiz = $this->createQuiz($approvedAdmin, 'Deleted quiz');
        $this->createLink($deletedQuiz);
        $deletedQuiz->delete();

        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/superadmin/stats')
            ->assertOk()
            ->assertJson([
                'total_admins' => 3,
                'approved_admins' => 2,
                'pending_admins' => 1,
                'total_quizzes' => 1,
                'total_quiz_links' => 1,
                'total_submitted_attempts' => 1,
            ]);

        $this->assertNotSame($approvedAdmin->id, $pendingAdmin->id);
    }

    public function test_admin_list_supports_status_search_and_capped_pagination(): void
    {
        $superAdmin = $this->createSuperAdmin('super@example.test');
        $this->createAdmin('pending-one@example.test', false, 'Pending One');
        $this->createAdmin('pending-two@example.test', false, 'Pending Two');
        $this->createAdmin('approved-target@example.test', true, 'Approved Target');
        $this->createAdmin('another@example.test', true, 'Another Admin');

        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/superadmin/admins?status=pending')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 20)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.is_approved', false)
            ->assertJsonMissing(['email' => 'approved-target@example.test']);

        $this->getJson('/api/superadmin/admins?search=approved-target%40example.test')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'approved-target@example.test');

        $this->getJson('/api/superadmin/admins?per_page=100')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 100);

        $this->getJson('/api/superadmin/admins?per_page=101')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('per_page');
    }

    public function test_admin_detail_returns_only_non_deleted_resource_counts(): void
    {
        $superAdmin = $this->createSuperAdmin('super@example.test');
        $admin = $this->createAdmin('detail@example.test', true);

        $this->createQuestion($admin, 'Question one');
        $this->createQuestion($admin, 'Question two');
        $deletedQuestion = $this->createQuestion($admin, 'Deleted question');
        $deletedQuestion->delete();

        $activeQuizOne = $this->createQuiz($admin, 'Quiz one');
        $activeQuizTwo = $this->createQuiz($admin, 'Quiz two');
        $deletedQuiz = $this->createQuiz($admin, 'Deleted quiz');
        $deletedQuiz->delete();

        $this->createLink($activeQuizOne);
        $this->createLink($activeQuizOne);
        $this->createLink($activeQuizTwo);
        $this->createLink($deletedQuiz);

        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/superadmin/admins/'.$admin->id)
            ->assertOk()
            ->assertJsonPath('data.id', $admin->id)
            ->assertJsonPath('data.email', 'detail@example.test')
            ->assertJsonPath('data.is_approved', true)
            ->assertJsonPath('data.questions_count', 2)
            ->assertJsonPath('data.quizzes_count', 2)
            ->assertJsonPath('data.quiz_links_count', 3)
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.tokens');
    }

    public function test_super_admin_targets_return_not_found_and_are_never_listed(): void
    {
        $superAdmin = $this->createSuperAdmin('target-super@example.test');
        $otherSuperAdmin = $this->createSuperAdmin('other-super@example.test');
        $this->createAdmin('visible-admin@example.test', true);

        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/superadmin/admins')
            ->assertOk()
            ->assertJsonMissing(['email' => 'target-super@example.test'])
            ->assertJsonMissing(['email' => 'other-super@example.test']);

        $this->getJson('/api/superadmin/admins/'.$otherSuperAdmin->id)
            ->assertNotFound();

        $this->patchJson('/api/superadmin/admins/'.$otherSuperAdmin->id, [
            'is_approved' => false,
        ])->assertNotFound();
    }

    public function test_approving_pending_admin_allows_login(): void
    {
        $superAdmin = $this->createSuperAdmin('super@example.test');
        $admin = $this->createAdmin('pending-login@example.test', false);
        Sanctum::actingAs($superAdmin);

        $this->postJson('/api/admin/login', [
            'email' => 'pending-login@example.test',
            'password' => 'password',
        ])->assertForbidden();

        $this->patchJson('/api/superadmin/admins/'.$admin->id, [
            'is_approved' => true,
        ])->assertOk()
            ->assertJsonPath('data.is_approved', true);

        $this->postJson('/api/admin/login', [
            'email' => 'pending-login@example.test',
            'password' => 'password',
        ])->assertOk()
            ->assertJsonStructure(['token', 'token_type', 'user']);
    }

    public function test_suspending_admin_revokes_existing_tokens_and_blocks_new_login(): void
    {
        $superAdmin = $this->createSuperAdmin('super@example.test');
        $admin = $this->createAdmin('suspend@example.test', true);
        $adminLogin = $this->postJson('/api/admin/login', [
            'email' => 'suspend@example.test',
            'password' => 'password',
        ]);
        $adminLogin->assertOk();
        $adminToken = $adminLogin->json('token');

        $superAdminLogin = $this->postJson('/api/admin/login', [
            'email' => 'super@example.test',
            'password' => 'password',
        ]);
        $superAdminLogin->assertOk();
        $superAdminToken = $superAdminLogin->json('token');

        Auth::forgetGuards();
        $this->withToken($adminToken)
            ->getJson('/api/me')
            ->assertOk();

        Auth::forgetGuards();
        $suspensionResponse = $this->withToken($superAdminToken)
            ->patchJson('/api/superadmin/admins/'.$admin->id, [
                'is_approved' => false,
            ]);
        $suspensionResponse
            ->assertOk()
            ->assertJsonPath('data.is_approved', false);

        Auth::forgetGuards();
        $this->withToken($adminToken)
            ->getJson('/api/me')
            ->assertUnauthorized();

        $this->postJson('/api/admin/login', [
            'email' => 'suspend@example.test',
            'password' => 'password',
        ])->assertForbidden();

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_super_admin_endpoints_require_authentication(): void
    {
        $this->getJson('/api/superadmin/stats')->assertUnauthorized();
        $this->getJson('/api/superadmin/admins')->assertUnauthorized();
    }

    private function createSuperAdmin(string $email): User
    {
        return User::factory()->create([
            'email' => $email,
            'role' => 'super_admin',
            'is_approved' => true,
            'password' => Hash::make('password'),
        ]);
    }

    private function createAdmin(
        string $email,
        bool $isApproved,
        string $name = 'Test Admin'
    ): User {
        return User::factory()->create([
            'name' => $name,
            'email' => $email,
            'role' => 'admin',
            'is_approved' => $isApproved,
            'password' => Hash::make('password'),
        ]);
    }

    private function createQuestion(User $owner, string $text): Question
    {
        $question = new Question();
        $question->created_by = $owner->id;
        $question->question_text = $text;
        $question->type = 'single';
        $question->marks = 1;
        $question->save();

        return $question;
    }

    private function createQuiz(User $owner, string $title): Quiz
    {
        $quiz = new Quiz();
        $quiz->owner_id = $owner->id;
        $quiz->title = $title;
        $quiz->description = 'Super admin test quiz';
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

    private function createSubmittedAttempt(QuizLink $link, int $score): QuizAttempt
    {
        $attempt = new QuizAttempt();
        $attempt->quiz_link_id = $link->id;
        $attempt->participant_name = 'Stats Participant';
        $attempt->started_at = now()->subMinutes(5);
        $attempt->submitted_at = now()->subMinute();
        $attempt->score = $score;
        $attempt->total_marks = 10;
        $attempt->save();

        return $attempt;
    }
}
