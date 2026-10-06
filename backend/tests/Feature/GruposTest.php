<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Acesso;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GruposTest extends TestCase
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

    /** Token de um usuário com as permissões de tela informadas. */
    private function entrar(array $permissoes, string $tenant = 'demo'): string
    {
        $user = User::factory()->create(['password' => 'senha']);
        $user->tenants()->attach($tenant);
        Tenant::find($tenant)->run(fn () => $user->givePermissionTo($permissoes));

        $token = $this->postJson("http://{$tenant}.localhost/api/login", [
            'cpf' => $user->cpf,
            'password' => 'senha',
        ])->assertOk()->json('token');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $token;
    }

    private function emDemo(string $token, string $metodo, string $url, array $dados = [])
    {
        $resposta = $this->withToken($token)->json($metodo, "http://demo.localhost{$url}", $dados);
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $resposta;
    }

    public function test_lista_os_grupos_com_telas_e_usuarios(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar(['administracao.grupos']);
        $maria = User::factory()->create();
        $maria->tenants()->attach('demo');
        Tenant::find('demo')->run(fn () => $maria->assignRole('cadastros'));

        $resposta = $this->emDemo($token, 'get', '/api/grupos')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.nome', 'Administrador')
            ->assertJsonPath('data.0.sistema', true)
            ->assertJsonPath('data.1.nome', 'Lançamentos')
            ->assertJsonPath('data.1.sistema', false);

        $cadastros = collect($resposta->json('data'))->firstWhere('nome', 'cadastros');
        $this->assertSame(1, $cadastros['usuarios']);
        $this->assertContains('cadastros.clientes', $cadastros['telas']);
    }

    public function test_cria_grupo_personalizado_com_telas_de_modulos_diferentes(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar(['administracao.grupos']);

        $this->emDemo($token, 'post', '/api/grupos', [
            'nome' => 'Fiscalização',
            'telas' => ['cadastros.clientes', 'lancamentos.vendas', 'relatorios.vendas_periodo'],
        ])
            ->assertCreated()
            ->assertJsonPath('nome', 'Fiscalização')
            ->assertJsonPath('usuarios', 0)
            ->assertJsonCount(3, 'telas');

        Tenant::find('demo')->run(function () {
            $grupo = Role::findByName('Fiscalização', 'web');
            $this->assertEqualsCanonicalizing(
                ['cadastros.clientes', 'lancamentos.vendas', 'relatorios.vendas_periodo'],
                $grupo->permissions->pluck('name')->all(),
            );
        });
    }

    public function test_altera_nome_e_telas_do_grupo(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar(['administracao.grupos']);
        $id = $this->emDemo($token, 'post', '/api/grupos', ['nome' => 'Fiscal', 'telas' => ['cadastros.produtos']])
            ->json('id');

        $this->emDemo($token, 'put', "/api/grupos/{$id}", [
            'nome' => 'Fiscalização de vendas',
            'telas' => ['lancamentos.vendas'],
        ])
            ->assertOk()
            ->assertJsonPath('nome', 'Fiscalização de vendas')
            ->assertJsonPath('telas', ['lancamentos.vendas']);
    }

    public function test_usuario_do_grupo_passa_a_enxergar_as_telas_dele(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar(['administracao.grupos']);
        $this->emDemo($token, 'post', '/api/grupos', [
            'nome' => 'Fiscalização',
            'telas' => ['lancamentos.vendas', 'cadastros.clientes'],
        ])->assertCreated();

        $maria = User::factory()->create(['password' => 'senha']);
        $maria->tenants()->attach('demo');
        Tenant::find('demo')->run(fn () => $maria->assignRole('Fiscalização'));
        tenancy()->end();

        $dela = $this->postJson('http://demo.localhost/api/login', ['cpf' => $maria->cpf, 'password' => 'senha'])
            ->json('token');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $this->emDemo($dela, 'get', '/api/me')
            ->assertJsonPath('grupos', ['Fiscalização'])
            ->assertJsonPath('permissoes', ['cadastros.clientes', 'lancamentos.vendas']);
    }

    public function test_recusa_nome_repetido_e_tela_desconhecida(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar(['administracao.grupos']);

        $this->emDemo($token, 'post', '/api/grupos', ['nome' => 'Lançamentos'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['nome' => 'Já existe um grupo com este nome.']);

        $this->emDemo($token, 'post', '/api/grupos', ['nome' => 'Outro', 'telas' => ['cadastros.inexistente']])
            ->assertJsonValidationErrors(['telas.0' => 'Tela desconhecida.']);
    }

    public function test_nao_da_para_incluir_a_tela_de_empresas(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar(['administracao.grupos']);

        $this->emDemo($token, 'post', '/api/grupos', ['nome' => 'Quase admin', 'telas' => ['administracao.empresas']])
            ->assertJsonValidationErrors(['telas.0']);
    }

    public function test_exclui_grupo_sem_usuarios_e_recusa_grupo_em_uso(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar(['administracao.grupos']);
        $id = $this->emDemo($token, 'post', '/api/grupos', ['nome' => 'Temporário'])->json('id');

        $this->emDemo($token, 'delete', "/api/grupos/{$id}")->assertNoContent();
        Tenant::find('demo')->run(fn () => $this->assertNull(Role::where('name', 'Temporário')->first()));

        $maria = User::factory()->create();
        $maria->tenants()->attach('demo');
        $emUso = Tenant::find('demo')->run(function () use ($maria) {
            $maria->assignRole('cadastros');

            return Role::findByName('cadastros', 'web')->id;
        });

        $this->emDemo($token, 'delete', "/api/grupos/{$emUso}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['grupo' => 'Este grupo é usado por 1 usuário(s). Tire o grupo deles antes de excluir.']);
    }

    public function test_quem_so_administra_usuarios_le_os_grupos_mas_nao_mexe(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar(['administracao.usuarios']);

        $this->emDemo($token, 'get', '/api/grupos')->assertOk();
        $this->emDemo($token, 'post', '/api/grupos', ['nome' => 'Novo'])->assertForbidden();
    }

    public function test_sem_permissao_nao_ve_os_grupos(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar(['cadastros.clientes']);

        $this->emDemo($token, 'get', '/api/grupos')->assertForbidden();
        $this->emDemo($token, 'delete', '/api/grupos/1')->assertForbidden();
    }

    public function test_grupo_administrador_nao_pode_ser_alterado_nem_excluido(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar(['administracao.grupos']);
        $id = collect($this->emDemo($token, 'get', '/api/grupos')->json('data'))
            ->firstWhere('nome', 'Administrador')['id'];
        $mensagem = 'O grupo Administrador é do sistema: tem acesso a tudo e não pode ser alterado nem excluído.';

        $this->emDemo($token, 'put', "/api/grupos/{$id}", ['nome' => 'Outro', 'telas' => []])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['grupo' => $mensagem]);

        $this->emDemo($token, 'delete', "/api/grupos/{$id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['grupo' => $mensagem]);

        Tenant::find('demo')->run(fn () => $this->assertNotNull(Role::where('name', 'Administrador')->first()));
    }

    public function test_tela_nova_no_catalogo_entra_no_administrador(): void
    {
        $tenant = $this->criarTenant('demo');
        $tenant->run(fn () => Role::findByName('Administrador', 'web')->syncPermissions([]));

        $this->artisan('acesso:sincronizar')->assertSuccessful();

        $tenant->run(fn () => $this->assertCount(
            count(Acesso::permissoes()),
            Role::findByName('Administrador', 'web')->permissions,
        ));
    }

    public function test_sincronizar_nao_desfaz_as_mudancas_feitas_na_tela(): void
    {
        $tenant = $this->criarTenant('demo');
        $token = $this->entrar(['administracao.grupos']);
        $id = collect($this->emDemo($token, 'get', '/api/grupos')->json('data'))
            ->firstWhere('nome', 'Lançamentos')['id'];
        $this->emDemo($token, 'put', "/api/grupos/{$id}", ['nome' => 'Lançamentos', 'telas' => ['relatorios.vendas_periodo']]);

        $this->artisan('acesso:sincronizar')->assertSuccessful();

        $tenant->run(fn () => $this->assertSame(
            ['relatorios.vendas_periodo'],
            Role::findByName('Lançamentos', 'web')->permissions->pluck('name')->all(),
        ));
    }
}
