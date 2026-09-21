<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginAdminRequest;
use App\Http\Requests\Auth\RegisterAdminRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Throwable;

class AdminAuthController extends Controller
{
    public function register(RegisterAdminRequest $request): JsonResponse
    {
        $validated = $request->validated();

        Log::info('Admin registration validation passed', [
            'email' => $validated['email'],
            'validated_keys' => array_keys($validated),
        ]);

        $user = new User();
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->password = Hash::make($validated['password']);
        $user->role = 'admin';
        $user->is_approved = false;

        Log::info('Admin registration database write attempt', [
            'email' => $user->email,
            'role' => $user->role,
            'is_approved' => $user->is_approved,
        ]);

        try {
            $user->save();
        } catch (Throwable $exception) {
            Log::error('Admin registration database write failed', [
                'email' => $user->email,
                'exception' => $exception,
            ]);

            throw $exception;
        }

        Log::info('Admin registration database write succeeded', [
            'user_id' => $user->id,
            'email' => $user->email,
        ]);

        $response = response()->json([
            'message' => 'registration submitted, account pending approval',
            'user' => $this->profilePayload($user),
        ], 201);

        Log::info('Admin registration response sent', [
            'user_id' => $user->id,
            'email' => $user->email,
            'response_status' => 201,
        ]);

        return $response;
    }

    public function login(LoginAdminRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'invalid credentials',
            ], 401);
        }

        if (! $user->is_approved) {
            return response()->json([
                'message' => 'account pending approval',
            ], 403);
        }

        $token = $user->createToken('admin-api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->profilePayload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'logged out',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->profilePayload($request->user()),
        ]);
    }

    /**
     * @return array{id: int, name: string, email: string, role: string}
     */
    private function profilePayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
    }
}
