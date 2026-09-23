<?php

namespace App\Http\Controllers;

use App\Http\Resources\EmpresaResource;
use App\Models\Tenant;
use App\Models\User;
use App\Rules\Cnpj;
use App\Rules\Cpf;
use App\Support\Cnpj as CnpjSupport;
use App\Support\Cpf as CpfSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Stancl\Tenancy\Database\Models\Domain;

/** Empresas (prefeituras clientes). Cadastrar uma empresa provisiona um tenant novo. */
class EmpresaController extends Controller
{
    /** Subdomínios que não podem virar prefeitura. */
    private const RESERVADOS = ['www', 'api', 'admin', 'app', 'mail', 'stm'];

    public function index(): AnonymousResourceCollection
    {
        return EmpresaResource::collection(Tenant::with('domains')->orderBy('nome')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->merge([
            'cnpj' => CnpjSupport::normalizar((string) $request->input('cnpj')),
            'subdominio' => strtolower(trim((string) $request->input('subdominio'))),
            'administrador' => [
                ...(array) $request->input('administrador', []),
                'cpf' => CpfSupport::digitos((string) $request->input('administrador.cpf')),
            ],
        ]);

        $dados = $request->validate([
            'nome' => ['required', 'string', 'max:150'],
            'cnpj' => ['required', 'string', new Cnpj, Rule::unique(Tenant::class, 'cnpj')],
            'subdominio' => [
                'required', 'string', 'max:40', 'regex:/^[a-z0-9]+(-[a-z0-9]+)*$/',
                Rule::notIn(self::RESERVADOS),
            ],
            // Administrador da prefeitura: entra no grupo Administrador, com acesso a tudo.
            'administrador.cpf' => ['required', 'string', new Cpf],
            'administrador.email' => ['required', 'string', 'email', 'max:150'],
            'administrador.senha' => ['required', 'string', 'min:8'],
        ], [
            'cnpj.unique' => 'Já existe uma empresa com este CNPJ.',
            'subdominio.regex' => 'Use apenas letras minúsculas, números e hífen.',
            'subdominio.not_in' => 'Este endereço é reservado.',
        ]);

        // O id do tenant dá nome ao banco (stm_tenant_<id>); hostnames usam hífen, ids usam "_".
        $id = str_replace('-', '_', $dados['subdominio']);
        $dominio = $dados['subdominio'].'.'.Arr::first(config('tenancy.central_domains'));

        if (Tenant::whereKey($id)->exists() || Domain::where('domain', $dominio)->exists()) {
            throw ValidationException::withMessages(['subdominio' => 'Este endereço já está em uso.']);
        }

        // Cria no contexto central: o provisionamento (banco, migrations, grupos) roda em fila.
        $tenant = tenancy()->central(function () use ($id, $dados, $dominio) {
            $administrador = $this->administrador($dados['administrador'], $dados['subdominio']);

            $tenant = Tenant::create([
                'id' => $id,
                'nome' => $dados['nome'],
                'cnpj' => $dados['cnpj'],
                // O vínculo com o grupo Administrador é feito quando o banco da prefeitura fica pronto.
                'administrador_id' => $administrador->id,
            ]);
            $tenant->domains()->create(['domain' => $dominio]);
            $administrador->tenants()->syncWithoutDetaching([$tenant->id]);

            return $tenant;
        });

        return (new EmpresaResource($tenant->fresh('domains')))->response()->setStatusCode(201);
    }

    /**
     * Administrador da prefeitura, no padrão `admin_<subdominio>`. Se o CPF já existir no STM,
     * o usuário existente é aproveitado (nome e senha dele são mantidos).
     */
    private function administrador(array $dados, string $subdominio): User
    {
        if ($existente = User::where('cpf', $dados['cpf'])->first()) {
            return $existente;
        }

        if (User::where('email', $dados['email'])->exists()) {
            throw ValidationException::withMessages([
                'administrador.email' => 'Este e-mail já está em uso por outro usuário.',
            ]);
        }

        return User::create([
            'name' => 'admin_'.str_replace('-', '_', $subdominio),
            'cpf' => $dados['cpf'],
            'email' => $dados['email'],
            'password' => $dados['senha'],
        ]);
    }
}
