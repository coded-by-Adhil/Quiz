<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_ping_endpoint_returns_ok(): void
    {
        $this->getJson('/api/ping')
            ->assertOk()
            ->assertExactJson(['status' => 'ok']);
    }

    public function test_admin_registration_assigns_safe_server_side_defaults(): void
    {
        $response = $this->postJson('/api/admin/register', [
            'name' => 'New Admin',
            'email' => 'new-admin@example.com',
            'password' => 'StrongPassword123!',
            'password_confirmation' => 'StrongPassword123!',
            'role' => 'super_admin',
            'is_approved' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'new-admin@example.com')
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonMissingPath('user.password')
            ->assertJsonMissingPath('user.is_approved');

        $user = User::where('email', 'new-admin@example.com')->firstOrFail();

        $this->assertSame('admin', $user->role);
        $this->assertFalse($user->is_approved);
        $this->assertTrue(Hash::check('StrongPassword123!', $user->password));
        $this->assertNotSame('StrongPassword123!', $user->password);
    }

    public function test_registration_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'duplicate@example.com']);

        $this->postJson('/api/admin/register', [
            'name' => 'Duplicate Admin',
            'email' => 'duplicate@example.com',
            'password' => 'StrongPassword123!',
            'password_confirmation' => 'StrongPassword123!',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('users', 1);
    }

    public function test_registration_rejects_password_mismatch_and_weak_password(): void
    {
        $this->postJson('/api/admin/register', [
            'name' => 'Mismatch Admin',
            'email' => 'mismatch@example.com',
            'password' => 'StrongPassword123!',
            'password_confirmation' => 'DifferentPassword123!',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');

        $this->postJson('/api/admin/register', [
            'name' => 'Weak Admin',
            'email' => 'weak@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_validates_required_fields_and_email_format(): void
    {
        $this->postJson('/api/admin/register', [
            'name' => '',
            'email' => 'not-an-email',
            'password' => '',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'approved@example.com',
            'password' => Hash::make('CorrectPassword123!'),
            'is_approved' => true,
        ]);

        $this->postJson('/api/admin/login', [
            'email' => 'approved@example.com',
            'password' => 'WrongPassword123!',
        ])->assertUnauthorized()
            ->assertJson(['message' => 'invalid credentials']);
    }

    public function test_unapproved_admin_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'pending@example.com',
            'password' => Hash::make('CorrectPassword123!'),
            'is_approved' => false,
        ]);

        $this->postJson('/api/admin/login', [
            'email' => 'pending@example.com',
            'password' => 'CorrectPassword123!',
        ])->assertForbidden()
            ->assertJson(['message' => 'account pending approval']);
    }

    public function test_approved_admin_can_login_view_profile_and_logout_revokes_token(): void
    {
        $user = User::factory()->create([
            'name' => 'Approved Admin',
            'email' => 'approved@example.com',
            'password' => Hash::make('CorrectPassword123!'),
            'is_approved' => true,
        ]);

        $loginResponse = $this->postJson('/api/admin/login', [
            'email' => 'approved@example.com',
            'password' => 'CorrectPassword123!',
        ])->assertOk()
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.role', 'admin');

        $token = $loginResponse->json('token');
        $headers = ['Authorization' => 'Bearer '.$token];

        $this->getJson('/api/me', $headers)
            ->assertOk()
            ->assertJsonPath('user.email', 'approved@example.com')
            ->assertJsonMissingPath('user.password');

        $this->postJson('/api/admin/logout', [], $headers)
            ->assertOk()
            ->assertJson(['message' => 'logged out']);

        Auth::forgetGuards();

        $this->getJson('/api/me', $headers)->assertUnauthorized();
        $this->postJson('/api/admin/logout', [], $headers)->assertUnauthorized();
    }

    public function test_super_admin_can_login_but_is_not_returned_as_an_admin_role(): void
    {
        User::factory()->create([
            'role' => 'super_admin',
            'email' => 'superadmin@example.com',
            'password' => Hash::make('CorrectPassword123!'),
            'is_approved' => true,
        ]);

        $this->postJson('/api/admin/login', [
            'email' => 'superadmin@example.com',
            'password' => 'CorrectPassword123!',
        ])->assertOk()
            ->assertJsonPath('user.role', 'super_admin');
    }

    public function test_invalid_or_missing_authentication_is_rejected(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
        $this->getJson('/api/me', [
            'Authorization' => 'Bearer invalid-token',
        ])->assertUnauthorized();
        $this->postJson('/api/admin/logout')->assertUnauthorized();
    }

    public function test_login_requires_email_and_password(): void
    {
        $this->postJson('/api/admin/login', [
            'email' => 'not-an-email',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }
}
