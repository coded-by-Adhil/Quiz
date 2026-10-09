<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_reports_connected_database(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertExactJson([
                'status' => 'ok',
                'database' => 'connected',
            ]);
    }

    public function test_health_hides_database_exception_and_returns_service_unavailable(): void
    {
        DB::shouldReceive('select')
            ->once()
            ->andThrow(new RuntimeException('private database failure'));

        Log::shouldReceive('error')
            ->once()
            ->withArgs(function (string $message, array $context): bool {
                return $message === 'Database health check failed.'
                    && isset($context['exception']);
            });

        $this->getJson('/api/health')
            ->assertStatus(503)
            ->assertExactJson([
                'status' => 'error',
                'database' => 'disconnected',
            ])
            ->assertJsonMissing(['private database failure']);
    }

    public function test_health_is_rate_limited_after_thirty_requests(): void
    {
        for ($request = 0; $request < 30; $request++) {
            $this->getJson('/api/health')->assertOk();
        }

        $this->getJson('/api/health')
            ->assertStatus(429)
            ->assertJson(['message' => 'Too Many Requests.']);
    }
}
