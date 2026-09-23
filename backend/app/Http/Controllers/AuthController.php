<?php

namespace App\Http\Controllers;

use App\Http\Resources\UsuarioResource;
use App\Models\User;
use App\Rules\Cpf;
use App\Support\Cpf as CpfSupport;
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
            'cpf' => ['required', 'string', new Cpf],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('cpf', CpfSupport::digitos($dados['cpf']))->first();
        $senhaConfere = $user && Hash::check($dados['password'], $user->password);

        // Senha certa e vínculo desativado: vale explicar, porque a conta é de quem está tentando.
        if ($senhaConfere && $user->vinculadoAoTenant(tenant('id')) && ! $user->acessaTenant(tenant('id'))) {
            throw ValidationException::withMessages([
                'cpf' => 'Seu acesso a esta prefeitura está desativado. Fale com o administrador.',
            ]);
        }

        if (! $senhaConfere || ! $user->acessaTenant(tenant('id'))) {
            throw ValidationException::withMessages([
                'cpf' => 'CPF ou senha inválidos.',
            ]);
        }

        $token = $user->createToken('web:'.tenant('id'))->plainTextToken;

        return response()->json(['token' => $token, 'usuario' => new UsuarioResource($user)]);
    }

    public function me(Request $request): UsuarioResource
    {
        return new UsuarioResource($request->user());
    }

    /** Nome e e-mail do próprio usuário: valem em todas as prefeituras em que ele trabalha. */
    public function atualizar(Request $request): UsuarioResource
    {
        $user = $request->user();

        $dados = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:150'],
        ]);

        if (User::where('email', $dados['email'])->whereKeyNot($user->id)->exists()) {
            throw ValidationException::withMessages(['email' => 'Este e-mail já está em uso por outro usuário.']);
        }

        $user->update($dados);

        return new UsuarioResource($user->fresh());
    }

    /** Troca da própria senha, conferindo a atual. As outras sessões caem. */
    public function alterarSenha(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'senha_atual' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($dados['senha_atual'], $user->password)) {
            throw ValidationException::withMessages(['senha_atual' => 'Senha atual incorreta.']);
        }

        $user->update(['password' => $dados['password']]);
        $user->tokens()->whereKeyNot($user->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Senha alterada.']);
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}
