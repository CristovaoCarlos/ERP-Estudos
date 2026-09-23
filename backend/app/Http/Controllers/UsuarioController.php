<?php

namespace App\Http\Controllers;

use App\Http\Resources\UsuarioDaPrefeituraResource;
use App\Models\Role;
use App\Models\User;
use App\Rules\Cpf;
use App\Support\Cpf as CpfSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Usuários da prefeitura atual. O cadastro fica no banco central: um usuário pode estar em
 * várias prefeituras, com grupos diferentes em cada uma.
 */
class UsuarioController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UsuarioDaPrefeituraResource::collection(
            tenant()->users()->orderBy('name')->get()
        );
    }

    /** Cria o usuário ou, se o CPF/e-mail já existir no STM, vincula o existente a esta prefeitura. */
    public function store(Request $request): JsonResponse
    {
        $request->merge(['cpf' => CpfSupport::digitos((string) $request->input('cpf'))]);

        $dados = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'cpf' => ['required', 'string', new Cpf],
            'email' => ['required', 'string', 'email', 'max:150'],
            'password' => ['required', 'string', 'min:8'],
            'grupos' => ['array'],
            'grupos.*' => [Rule::exists(Role::class, 'name')],
        ]);

        $existente = User::where('cpf', $dados['cpf'])->orWhere('email', $dados['email'])->first();

        if ($existente && $existente->cpf !== $dados['cpf']) {
            throw ValidationException::withMessages(['email' => 'Este e-mail já está em uso por outro usuário.']);
        }

        $user = $existente ?? User::create([
            'name' => $dados['name'],
            'cpf' => $dados['cpf'],
            'email' => $dados['email'],
            'password' => $dados['password'],
        ]);

        $user->tenants()->syncWithoutDetaching([tenant('id')]);
        $user->syncRoles($dados['grupos'] ?? []);

        // `vinculado`: o usuário já existia no STM e só ganhou acesso a esta prefeitura.
        return response()->json(
            (new UsuarioDaPrefeituraResource($user->fresh()))->resolve($request) + ['vinculado' => (bool) $existente],
            201,
        );
    }

    /** Dados do cadastro. Quem também está em outra prefeitura só muda os grupos (`vinculos`). */
    public function update(Request $request, User $usuario): UsuarioDaPrefeituraResource
    {
        $this->daPrefeitura($usuario);

        $dados = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:150'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if ($usuario->tenants()->count() === 1) {
            if (User::where('email', $dados['email'])->whereKeyNot($usuario->id)->exists()) {
                throw ValidationException::withMessages(['email' => 'Este e-mail já está em uso por outro usuário.']);
            }

            $usuario->update(array_filter([
                'name' => $dados['name'],
                'email' => $dados['email'],
                'password' => $dados['password'] ?? null,
            ]));
        }

        return new UsuarioDaPrefeituraResource($usuario->fresh());
    }

    /** Grupos do usuário nesta prefeitura (tela "Editar vínculos"). */
    public function vinculos(Request $request, User $usuario): UsuarioDaPrefeituraResource
    {
        $this->daPrefeitura($usuario);

        $dados = $request->validate([
            'grupos' => ['present', 'array'],
            'grupos.*' => [Rule::exists(Role::class, 'name')],
        ]);

        $usuario->syncRoles($dados['grupos']);

        return new UsuarioDaPrefeituraResource($usuario->fresh());
    }

    /** Ativa ou desativa o acesso do usuário a esta prefeitura. Desativar encerra as sessões dele aqui. */
    public function status(Request $request, User $usuario): UsuarioDaPrefeituraResource
    {
        $this->daPrefeitura($usuario);

        $dados = $request->validate(['ativo' => ['required', 'boolean']]);

        if (! $dados['ativo'] && $usuario->is($request->user())) {
            throw ValidationException::withMessages(['usuario' => 'Você não pode desativar o seu próprio acesso.']);
        }

        $usuario->tenants()->updateExistingPivot(tenant('id'), ['ativo' => $dados['ativo']]);

        if (! $dados['ativo']) {
            $usuario->tokens()->where('name', 'web:'.tenant('id'))->delete();
        }

        return new UsuarioDaPrefeituraResource($usuario->fresh());
    }

    /** Tira o acesso a esta prefeitura: o usuário continua no STM, nas outras prefeituras. */
    public function destroy(Request $request, User $usuario): Response
    {
        $this->daPrefeitura($usuario);

        if ($usuario->is($request->user())) {
            throw ValidationException::withMessages(['usuario' => 'Você não pode remover o seu próprio acesso.']);
        }

        $usuario->syncRoles([]);
        $usuario->tenants()->detach(tenant('id'));
        $usuario->tokens()->where('name', 'web:'.tenant('id'))->delete();

        return response()->noContent();
    }

    private function daPrefeitura(User $usuario): void
    {
        // Vínculo, ativo ou não: o administrador precisa enxergar quem está desativado.
        abort_unless($usuario->vinculadoAoTenant(tenant('id')), 404, 'Usuário não encontrado nesta prefeitura.');
    }
}
