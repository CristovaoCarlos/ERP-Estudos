<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\RedefinirSenha;
use App\Rules\Cpf;
use App\Support\Cpf as CpfSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

/**
 * Recuperação de senha por e-mail. O pedido é feito na prefeitura em que o usuário entra, e o
 * link leva ao endereço dela; os tokens ficam no banco central (`password_reset_tokens`).
 */
class SenhaController extends Controller
{
    /** Resposta sempre igual: não revela quais CPFs existem. */
    private const AVISO = 'Se o CPF estiver cadastrado nesta prefeitura, enviamos um e-mail com o link para redefinir a senha.';

    public function esqueci(Request $request): JsonResponse
    {
        $dados = $request->validate(['cpf' => ['required', 'string', new Cpf]]);

        $user = User::where('cpf', CpfSupport::digitos($dados['cpf']))->first();

        if ($user?->acessaTenant(tenant('id'))) {
            Password::sendResetLink(
                ['email' => $user->email],
                fn (User $user, string $token) => $user->notify(new RedefinirSenha(
                    $this->linkDaPrefeitura($request, $token, $user),
                    tenant('nome') ?? tenant('id'),
                    config('auth.passwords.users.expire'),
                )),
            );
        }

        return response()->json(['message' => self::AVISO]);
    }

    public function redefinir(Request $request): JsonResponse
    {
        $request->merge(['cpf' => CpfSupport::digitos((string) $request->input('cpf'))]);

        $dados = $request->validate([
            'cpf' => ['required', 'string', new Cpf],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::where('cpf', $dados['cpf'])->first();

        if (! $user?->acessaTenant(tenant('id'))) {
            throw ValidationException::withMessages(['token' => 'Link inválido ou expirado. Peça um novo.']);
        }

        $resultado = Password::reset([
            'email' => $user->email,
            'password' => $dados['password'],
            'password_confirmation' => $request->input('password_confirmation'),
            'token' => $dados['token'],
        ], function (User $user, string $senha) {
            $user->update(['password' => $senha]);
            // Trocou a senha: as sessões abertas em qualquer prefeitura caem.
            $user->tokens()->delete();
        });

        if ($resultado !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => 'Link inválido ou expirado. Peça um novo.']);
        }

        return response()->json(['message' => 'Senha alterada. Entre com a senha nova.']);
    }

    /** O link abre no mesmo endereço em que o pedido foi feito (o Host identifica a prefeitura). */
    private function linkDaPrefeitura(Request $request, string $token, User $user): string
    {
        $parametros = http_build_query(['token' => $token, 'cpf' => $user->cpf]);

        return $request->getSchemeAndHttpHost()."/redefinir-senha?{$parametros}";
    }
}
