<?php

namespace App\Http\Controllers;

use App\Http\Resources\UsuarioResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $dados['email'])->first();

        if (! $user || ! Hash::check($dados['password'], $user->password) || ! $user->acessaTenant(tenant('id'))) {
            throw ValidationException::withMessages([
                'email' => 'E-mail ou senha inválidos.',
            ]);
        }

        $token = $user->createToken('web:'.tenant('id'))->plainTextToken;

        return response()->json(['token' => $token, 'usuario' => new UsuarioResource($user)]);
    }

    public function me(Request $request): UsuarioResource
    {
        return new UsuarioResource($request->user());
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}
