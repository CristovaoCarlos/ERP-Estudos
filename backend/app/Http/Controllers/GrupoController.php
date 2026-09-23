<?php

namespace App\Http\Controllers;

use App\Http\Resources\GrupoResource;
use App\Models\Role;
use App\Support\Acesso;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Grupos de acesso da prefeitura atual: o grupo reúne as telas que os usuários dele enxergam.
 * Os grupos ficam no banco da prefeitura, então cada uma monta os seus.
 */
class GrupoController extends Controller
{
    /** Serve à tela de grupos e ao formulário de usuários: basta uma das duas permissões. */
    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless(
            $request->user()->can('administracao.grupos') || $request->user()->can('administracao.usuarios'),
            403,
            'Sem permissão para ver os grupos.',
        );

        return GrupoResource::collection($this->grupos());
    }

    public function store(Request $request): JsonResponse
    {
        $dados = $this->validar($request);

        $grupo = Role::create(['name' => $dados['nome'], 'guard_name' => Acesso::GUARD]);
        $grupo->syncPermissions($dados['telas'] ?? []);

        return (new GrupoResource($this->grupos($grupo->id)))->response()->setStatusCode(201);
    }

    public function update(Request $request, Role $grupo): GrupoResource
    {
        $this->recusarGrupoDoSistema($grupo);
        $dados = $this->validar($request, $grupo);

        $grupo->update(['name' => $dados['nome']]);
        $grupo->syncPermissions($dados['telas'] ?? []);

        return new GrupoResource($this->grupos($grupo->id));
    }

    public function destroy(Role $grupo): Response
    {
        $this->recusarGrupoDoSistema($grupo);
        $usuarios = $this->contarUsuarios($grupo->id);

        if ($usuarios > 0) {
            throw ValidationException::withMessages([
                'grupo' => "Este grupo é usado por {$usuarios} usuário(s). Tire o grupo deles antes de excluir.",
            ]);
        }

        $grupo->delete();

        return response()->noContent();
    }

    private function recusarGrupoDoSistema(Role $grupo): void
    {
        if ($grupo->name === Acesso::ADMINISTRADOR) {
            throw ValidationException::withMessages([
                'grupo' => 'O grupo Administrador é do sistema: tem acesso a tudo e não pode ser alterado nem excluído.',
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function validar(Request $request, ?Role $grupo = null): array
    {
        return $request->validate([
            'nome' => [
                'required', 'string', 'max:60',
                Rule::unique(Role::class, 'name')->ignore($grupo?->id),
            ],
            'telas' => ['array'],
            'telas.*' => [Rule::in(Acesso::permissoes())],
        ], [
            'nome.unique' => 'Já existe um grupo com este nome.',
            'telas.*.in' => 'Tela desconhecida.',
        ]);
    }

    /** Grupos com as telas e a contagem de usuários (o pivô fica no banco da prefeitura). */
    private function grupos(?int $id = null)
    {
        $usuarios = DB::connection('tenant')
            ->table('model_has_roles')
            ->selectRaw('role_id, count(*) as total')
            ->groupBy('role_id')
            ->pluck('total', 'role_id');

        $grupos = Role::with('permissions')
            ->when($id, fn ($consulta) => $consulta->whereKey($id))
            ->orderBy('name')
            ->get()
            ->each(fn (Role $grupo) => $grupo->usuarios = (int) ($usuarios[$grupo->id] ?? 0));

        return $id ? $grupos->firstOrFail() : $grupos;
    }

    private function contarUsuarios(int $id): int
    {
        return DB::connection('tenant')->table('model_has_roles')->where('role_id', $id)->count();
    }
}
