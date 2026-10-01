<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Acesso;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcessoTest extends TestCase
{
    use RefreshDatabase;

    /** @var list<Tenant> */
    private array $tenants = [];

    protected function tearDown(): void
    {
        tenancy()->end();
        foreach ($this->tenants as $tenant) {
            $tenant->delete();
        }

        parent::tearDown();
    }

    private function criarTenant(string $id): Tenant
    {
        $tenant = Tenant::create(['id' => $id, 'nome' => "Prefeitura {$id}"]);
        $tenant->domains()->create(['domain' => "{$id}.localhost"]);

        return $this->tenants[] = $tenant;
    }

    /** @param array<string, list<string>> $grupos id do tenant => grupos */
    private function criarUsuario(array $grupos, bool $superadmin = false): User
    {
        $user = User::factory()->create(['password' => 'senha', 'superadmin' => $superadmin]);
        $user->tenants()->attach(array_keys($grupos));

        foreach ($grupos as $tenantId => $nomes) {
            Tenant::find($tenantId)->run(fn () => $user->assignRole($nomes));
        }

        return $user;
    }

    private function me(User $user, string $tenant)
    {
        $token = $this->postJson("http://{$tenant}.localhost/api/login", [
            'cpf' => $user->cpf,
            'password' => 'senha',
        ])->assertOk()->json('token');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $this->withToken($token)->getJson("http://{$tenant}.localhost/api/me")->assertOk();
    }

    public function test_provisionamento_cria_os_grupos_padrao_com_as_permissoes_do_modulo(): void
    {
        $tenant = $this->criarTenant('demo');

        $this->assertNotNull($tenant->fresh()->provisionado_em);
        $tenant->run(function () {
            $this->assertSame(count(Acesso::permissoes()), Permission::count());
            $this->assertEqualsCanonicalizing(
                ['Administrador', 'Parâmetros', 'Tabelas', 'Lançamentos'],
                Role::pluck('name')->all(),
            );

            // Administrador: todas as telas do catálogo.
            $this->assertEqualsCanonicalizing(
                Acesso::permissoes(),
                Role::findByName(Acesso::ADMINISTRADOR)->permissions->pluck('name')->all(),
            );

            $parametros = Role::findByName('Parâmetros')->permissions->pluck('name');
            $this->assertContains('parametros.receitas', $parametros);
            $this->assertNotContains('parametros.empresa', $parametros);
            $this->assertTrue($parametros->every(fn (string $p) => str_starts_with($p, 'parametros.')));
            $this->assertContains('tabelas.tomadores.tomador', Role::findByName('Tabelas')->permissions->pluck('name'));
            $this->assertNotContains('administracao.tabelas-comuns.cnae', Role::findByName('Tabelas')->permissions->pluck('name'));
            // Tabelas Comuns são só do superadmin: nem o Administrador da prefeitura as recebe.
            $this->assertNotContains('administracao.tabelas-comuns.cnae', Role::findByName(Acesso::ADMINISTRADOR)->permissions->pluck('name'));
            $this->assertContains('lancamentos.dam.consultas', Role::findByName('Lançamentos')->permissions->pluck('name'));
        });
    }

    public function test_sincronizar_apaga_permissoes_fora_do_catalogo_e_mantem_grupos_proprios(): void
    {
        $tenant = $this->criarTenant('demo');

        $tenant->run(function () {
            Permission::create(['name' => 'parametros.empresa', 'guard_name' => 'web']);
            Role::create(['name' => 'Fiscal', 'guard_name' => 'web']);

            Acesso::sincronizar();

            $this->assertNull(Permission::where('name', 'parametros.empresa')->first());
            $this->assertNotNull(Role::where('name', 'Fiscal')->first());
        });
    }

    public function test_me_traz_as_permissoes_dos_grupos_do_usuario(): void
    {
        $this->criarTenant('demo');
        $user = $this->criarUsuario(['demo' => ['Parâmetros']]);

        $resposta = $this->me($user, 'demo')
            ->assertJsonPath('superadmin', false)
            ->assertJsonPath('grupos', ['Parâmetros']);

        $this->assertEqualsCanonicalizing(config('acesso.permissoes.parametros'), $resposta->json('permissoes'));
    }

    public function test_grupos_e_permissoes_sao_separados_por_prefeitura(): void
    {
        $this->criarTenant('demo');
        $this->criarTenant('outra');
        $user = $this->criarUsuario(['demo' => ['Tabelas'], 'outra' => ['Lançamentos']]);

        $this->assertContains('tabelas.ufm', $this->me($user, 'demo')->json('permissoes'));

        $outra = $this->me($user, 'outra')->assertJsonPath('grupos', ['Lançamentos'])->json('permissoes');
        $this->assertContains('lancamentos.iptu', $outra);
        $this->assertNotContains('tabelas.ufm', $outra);
    }

    public function test_superadmin_na_administradora_tem_todas_as_permissoes_e_empresas(): void
    {
        $this->criarTenant('demo');
        $user = $this->criarUsuario(['demo' => []], superadmin: true);

        $permissoes = $this->me($user, 'demo')->assertJsonPath('superadmin', true)->json('permissoes');

        $this->assertContains(Acesso::EMPRESAS, $permissoes);
        $this->assertContains('administracao.tabelas-comuns.cidades', $permissoes);
        $this->assertContains('administracao.usuarios', $permissoes);
        $this->assertCount(count(Acesso::permissoes()) + count(Acesso::exclusivasDoSuperadmin()), $permissoes);
    }

    public function test_superadmin_fora_da_administradora_nao_tem_poderes(): void
    {
        $this->criarTenant('demo');
        $this->criarTenant('outra');
        $user = $this->criarUsuario(['demo' => [], 'outra' => []], superadmin: true);

        $this->me($user, 'outra')
            ->assertJsonPath('superadmin', false)
            ->assertJsonPath('permissoes', []);
    }

    public function test_comando_sincroniza_as_prefeituras(): void
    {
        $tenant = $this->criarTenant('demo');
        $tenant->run(fn () => Role::findByName('Tabelas')->delete());

        $this->artisan('acesso:sincronizar')->assertSuccessful();

        $tenant->run(fn () => $this->assertNotNull(Role::where('name', 'Tabelas')->first()));
    }

    public function test_comando_recusa_prefeitura_inexistente(): void
    {
        $this->artisan('acesso:sincronizar', ['--tenant' => ['nao_existe']])->assertFailed();
    }
}
