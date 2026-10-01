<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Acesso;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmpresasTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        tenancy()->end();
        foreach (Tenant::all() as $tenant) {
            $tenant->delete();
        }

        parent::tearDown();
    }

    private function criarTenant(string $id): Tenant
    {
        $tenant = Tenant::create(['id' => $id, 'nome' => "Prefeitura {$id}"]);
        $tenant->domains()->create(['domain' => "{$id}.localhost"]);

        return $tenant;
    }

    /** Token de um usuário vinculado ao tenant. */
    private function entrar(string $tenant, bool $superadmin): string
    {
        $user = User::factory()->create(['password' => 'senha', 'superadmin' => $superadmin]);
        $user->tenants()->attach($tenant);

        $token = $this->postJson("http://{$tenant}.localhost/api/login", [
            'cpf' => $user->cpf,
            'password' => 'senha',
        ])->assertOk()->json('token');
        tenancy()->end();

        return $token;
    }

    private function cadastrar(string $token, array $dados, string $tenant = 'demo')
    {
        $resposta = $this->withToken($token)->postJson("http://{$tenant}.localhost/api/empresas", $dados + [
            'nome' => 'Prefeitura de Nova Esperança',
            'cnpj' => '11.222.333/0001-81',
            'subdominio' => 'nova-esperanca',
            'administrador' => [
                'cpf' => '529.982.247-25',
                'email' => 'admin@nova-esperanca.gov.br',
                'senha' => 'senha-do-admin',
            ],
        ]);
        tenancy()->end();

        return $resposta;
    }

    public function test_superadmin_cadastra_empresa_e_provisiona_a_prefeitura(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar('demo', superadmin: true);

        $this->cadastrar($token, [])
            ->assertCreated()
            ->assertExactJson([
                'id' => 'nova_esperanca',
                'nome' => 'Prefeitura de Nova Esperança',
                'cnpj' => '11222333000181',
                'dominio' => 'nova-esperanca.localhost',
                'situacao' => 'ativa',
                'criada_em' => Tenant::find('nova_esperanca')->created_at->toIso8601String(),
            ]);

        $tenant = Tenant::find('nova_esperanca');
        $this->assertNotNull($tenant->provisionado_em);
        $tenant->run(fn () => $this->assertSame(4, Role::count()));

        // O administrador da prefeitura entra no padrão admin_<subdominio>, no grupo Administrador.
        $admin = User::where('cpf', '52998224725')->firstOrFail();
        $this->assertSame('admin_nova_esperanca', $admin->name);
        $this->assertTrue($admin->acessaTenant('nova_esperanca'));
        $tenant->run(fn () => $this->assertSame([Acesso::ADMINISTRADOR], $admin->getRoleNames()->all()));

        $this->getJson('http://nova-esperanca.localhost/api/tenant')
            ->assertExactJson(['id' => 'nova_esperanca', 'nome' => 'Prefeitura de Nova Esperança']);
    }

    public function test_superadmin_lista_as_empresas(): void
    {
        $this->criarTenant('demo');
        $this->criarTenant('outra');
        $token = $this->entrar('demo', superadmin: true);

        $this->withToken($token)->getJson('http://demo.localhost/api/empresas')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', 'demo')
            ->assertJsonPath('data.0.dominio', 'demo.localhost')
            ->assertJsonPath('data.0.situacao', 'ativa');
    }

    public function test_usuario_comum_nao_acessa_empresas(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar('demo', superadmin: false);

        $this->withToken($token)->getJson('http://demo.localhost/api/empresas')->assertForbidden();
        tenancy()->end();
        $this->cadastrar($token, [])->assertForbidden();
        $this->assertNull(Tenant::find('nova_esperanca'));
    }

    public function test_superadmin_fora_da_administradora_nao_acessa_empresas(): void
    {
        $this->criarTenant('demo');
        $this->criarTenant('outra');
        $token = $this->entrar('outra', superadmin: true);

        $this->withToken($token)->getJson('http://outra.localhost/api/empresas')->assertForbidden();
    }

    public function test_valida_cnpj_e_subdominio(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar('demo', superadmin: true);

        $this->cadastrar($token, ['cnpj' => '11.222.333/0001-82', 'subdominio' => 'Nova Esperança!'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'cnpj' => 'Informe um CNPJ válido.',
                'subdominio' => 'Use apenas letras minúsculas, números e hífen.',
            ]);

        $this->cadastrar($token, ['subdominio' => 'www'])
            ->assertJsonValidationErrors(['subdominio' => 'Este endereço é reservado.']);
    }

    public function test_aceita_cnpj_alfanumerico(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar('demo', superadmin: true);

        $this->cadastrar($token, ['cnpj' => '12.abc.345/01de-35'])
            ->assertCreated()
            ->assertJsonPath('cnpj', '12ABC34501DE35');
    }

    public function test_recusa_endereco_e_cnpj_ja_usados(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar('demo', superadmin: true);
        $this->cadastrar($token, [])->assertCreated();

        $this->cadastrar($token, ['cnpj' => '12ABC34501DE35'])
            ->assertJsonValidationErrors(['subdominio' => 'Este endereço já está em uso.']);

        $this->cadastrar($token, ['subdominio' => 'outro-municipio'])
            ->assertJsonValidationErrors(['cnpj' => 'Já existe uma empresa com este CNPJ.']);

        $this->cadastrar($token, ['cnpj' => '12ABC34501DE35', 'subdominio' => 'demo'])
            ->assertJsonValidationErrors(['subdominio' => 'Este endereço já está em uso.']);
    }

    public function test_administrador_da_prefeitura_entra_e_ve_tudo(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar('demo', superadmin: true);
        $this->cadastrar($token, [])->assertCreated();
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $acesso = $this->postJson('http://nova-esperanca.localhost/api/login', [
            'cpf' => '529.982.247-25',
            'password' => 'senha-do-admin',
        ])->assertOk();
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $acesso->assertJsonPath('usuario.grupos', [Acesso::ADMINISTRADOR]);
        $this->assertEqualsCanonicalizing(Acesso::permissoes(), $acesso->json('usuario.permissoes'));
        // Superadmin é só da Demo: o administrador da prefeitura não cadastra empresas.
        $this->withToken($acesso->json('token'))
            ->getJson('http://nova-esperanca.localhost/api/empresas')
            ->assertForbidden();
    }

    public function test_exige_os_dados_do_administrador(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar('demo', superadmin: true);

        $this->withToken($token)->postJson('http://demo.localhost/api/empresas', [
            'nome' => 'Prefeitura de Nova Esperança',
            'cnpj' => '11.222.333/0001-81',
            'subdominio' => 'nova-esperanca',
        ])->assertUnprocessable()->assertJsonValidationErrors([
            'administrador.cpf',
            'administrador.email',
            'administrador.senha',
        ]);
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $this->cadastrar($token, ['administrador' => [
            'cpf' => '111.111.111-11',
            'email' => 'sem-arroba',
            'senha' => 'curta',
        ]])->assertJsonValidationErrors([
            'administrador.cpf',
            'administrador.email',
            'administrador.senha',
        ]);

        $this->assertNull(Tenant::find('nova_esperanca'));
    }

    public function test_cpf_ja_cadastrado_vira_administrador_da_nova_prefeitura(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar('demo', superadmin: true);
        $maria = User::factory()->create(['name' => 'Maria', 'cpf' => '52998224725']);

        $this->cadastrar($token, [])->assertCreated();

        $this->assertSame(1, User::where('cpf', '52998224725')->count());
        $this->assertSame('Maria', $maria->fresh()->name);
        $this->assertTrue($maria->fresh()->acessaTenant('nova_esperanca'));
    }
}
