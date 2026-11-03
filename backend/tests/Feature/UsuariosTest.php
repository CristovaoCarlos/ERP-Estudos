<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Support\Cpf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UsuariosTest extends TestCase
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

    /**
     * Usuário com o grupo informado e o token dele. Nenhum grupo dá acesso a Administração,
     * então a permissão da tela é dada direto ao usuário (como faria o superadmin).
     */
    private function entrar(string $tenant, array $grupos = [], bool $superadmin = false, bool $administra = true): array
    {
        $user = User::factory()->create(['password' => 'senha', 'superadmin' => $superadmin]);
        $user->tenants()->attach($tenant);
        Tenant::find($tenant)->run(function () use ($user, $grupos, $administra) {
            $user->assignRole($grupos);
            if ($administra) {
                $user->givePermissionTo('administracao.usuarios');
            }
        });

        $token = $this->postJson("http://{$tenant}.localhost/api/login", [
            'cpf' => $user->cpf,
            'password' => 'senha',
        ])->assertOk()->json('token');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return [$user, $token];
    }

    private function cadastrar(string $token, array $dados = [], string $tenant = 'demo')
    {
        $resposta = $this->withToken($token)->postJson("http://{$tenant}.localhost/api/usuarios", $dados + [
            'name' => 'Maria Souza',
            'cpf' => '529.982.247-25',
            'email' => 'maria@exemplo.com',
            'password' => 'segredo-forte',
            'grupos' => ['Lançamentos'],
        ]);
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $resposta;
    }

    public function test_lista_os_usuarios_da_prefeitura_com_os_grupos(): void
    {
        $this->criarTenant('demo');
        $this->criarTenant('outra');
        [$eu, $token] = $this->entrar('demo', ['cadastros']);
        $this->entrar('outra', ['Lançamentos']);

        $this->withToken($token)->getJson('http://demo.localhost/api/usuarios')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $eu->id)
            ->assertJsonPath('data.0.grupos', ['cadastros'])
            ->assertJsonPath('data.0.somente_grupos', false)
            ->assertJsonPath('data.0.ativo', true);
    }

    public function test_administrador_desativa_e_reativa_o_acesso(): void
    {
        $this->criarTenant('demo');
        $this->criarTenant('outra');
        [, $token] = $this->entrar('demo', ['cadastros']);
        $maria = User::factory()->create(['cpf' => Cpf::gerar(), 'password' => 'senha']);
        $maria->tenants()->attach(['demo', 'outra']);
        $tokenDela = $maria->createToken('web:demo')->plainTextToken;

        $this->withToken($token)->putJson("http://demo.localhost/api/usuarios/{$maria->id}/status", ['ativo' => false])
            ->assertOk()
            ->assertJsonPath('ativo', false);
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        // Perde o acesso a esta prefeitura, mas continua na outra.
        $this->assertFalse($maria->fresh()->acessaTenant('demo'));
        $this->assertTrue($maria->fresh()->acessaTenant('outra'));
        $this->withToken($tokenDela)->getJson('http://demo.localhost/api/me')->assertUnauthorized();
        tenancy()->end();
        $this->app['auth']->forgetGuards();
        $this->postJson('http://demo.localhost/api/login', ['cpf' => $maria->cpf, 'password' => 'senha'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cpf' => 'Seu acesso a esta prefeitura está desativado. Fale com o administrador.']);
        tenancy()->end();
        $this->app['auth']->forgetGuards();
        $this->postJson('http://outra.localhost/api/login', ['cpf' => $maria->cpf, 'password' => 'senha'])->assertOk();
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->putJson("http://demo.localhost/api/usuarios/{$maria->id}/status", ['ativo' => true])
            ->assertOk()
            ->assertJsonPath('ativo', true);
        $this->assertTrue($maria->fresh()->acessaTenant('demo'));
    }

    public function test_usuario_desativado_continua_na_lista_e_pode_ser_alterado(): void
    {
        $this->criarTenant('demo');
        [, $token] = $this->entrar('demo', ['cadastros']);
        $maria = User::factory()->create(['cpf' => Cpf::gerar(), 'password' => 'senha']);
        $maria->tenants()->attach('demo', ['ativo' => false]);

        $lista = $this->withToken($token)->getJson('http://demo.localhost/api/usuarios')
            ->assertJsonCount(2, 'data')
            ->json('data');
        $this->assertFalse(collect($lista)->firstWhere('id', $maria->id)['ativo']);

        $this->withToken($token)->putJson("http://demo.localhost/api/usuarios/{$maria->id}", [
            'name' => 'Maria', 'email' => 'maria@exemplo.com',
        ])->assertOk()->assertJsonPath('ativo', false);
    }

    public function test_nao_desativa_o_proprio_acesso(): void
    {
        $this->criarTenant('demo');
        [$eu, $token] = $this->entrar('demo', ['cadastros']);

        $this->withToken($token)->putJson("http://demo.localhost/api/usuarios/{$eu->id}/status", ['ativo' => false])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['usuario' => 'Você não pode desativar o seu próprio acesso.']);
    }

    public function test_sem_a_permissao_da_tela_nao_desativa(): void
    {
        $this->criarTenant('demo');
        [, $token] = $this->entrar('demo', ['Lançamentos'], administra: false);
        [$outro] = $this->entrar('demo');

        $this->withToken($token)->putJson("http://demo.localhost/api/usuarios/{$outro->id}/status", ['ativo' => false])
            ->assertForbidden();
    }

    public function test_cadastra_usuario_novo_com_grupos(): void
    {
        $this->criarTenant('demo');
        [, $token] = $this->entrar('demo', ['cadastros']);

        $this->cadastrar($token)
            ->assertCreated()
            ->assertJsonPath('name', 'Maria Souza')
            ->assertJsonPath('cpf', '52998224725')
            ->assertJsonPath('grupos', ['Lançamentos'])
            ->assertJsonPath('vinculado', false);

        $maria = User::where('cpf', '52998224725')->firstOrFail();
        $this->assertTrue($maria->acessaTenant('demo'));
        $this->assertTrue(Hash::check('segredo-forte', $maria->password));
    }

    public function test_cpf_ja_cadastrado_vincula_o_usuario_e_mantem_a_senha(): void
    {
        $this->criarTenant('demo');
        $this->criarTenant('outra');
        [, $token] = $this->entrar('demo', ['cadastros']);
        $maria = User::factory()->create([
            'name' => 'Maria da outra',
            'cpf' => '52998224725',
            'email' => 'maria@exemplo.com',
            'password' => 'senha-antiga',
        ]);
        $maria->tenants()->attach('outra');

        $this->cadastrar($token)
            ->assertCreated()
            ->assertJsonPath('vinculado', true)
            ->assertJsonPath('name', 'Maria da outra')
            ->assertJsonPath('somente_grupos', true);

        $maria->refresh();
        $this->assertTrue($maria->acessaTenant('demo'));
        $this->assertTrue(Hash::check('senha-antiga', $maria->password));
        $this->assertEqualsCanonicalizing(['demo', 'outra'], $maria->tenants()->pluck('id')->all());
    }

    public function test_recusa_cpf_invalido_grupo_inexistente_e_email_de_outro_usuario(): void
    {
        $this->criarTenant('demo');
        [, $token] = $this->entrar('demo', ['cadastros']);
        User::factory()->create(['email' => 'ocupado@exemplo.com']);

        $this->cadastrar($token, ['cpf' => '111.111.111-11', 'grupos' => ['Fiscalização']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cpf', 'grupos.0']);

        $this->cadastrar($token, ['email' => 'ocupado@exemplo.com'])
            ->assertJsonValidationErrors(['email' => 'Este e-mail já está em uso por outro usuário.']);

        $this->cadastrar($token, ['password' => 'curta'])
            ->assertJsonValidationErrors(['password']);
    }

    public function test_altera_dados_e_grupos(): void
    {
        $this->criarTenant('demo');
        [, $token] = $this->entrar('demo', ['cadastros']);
        $maria = $this->cadastrar($token)->json('id');

        $this->withToken($token)->putJson("http://demo.localhost/api/usuarios/{$maria}", [
            'name' => 'Maria Souza Lima',
            'email' => 'maria.lima@exemplo.com',
            'password' => 'outra-senha-forte',
        ])->assertOk()->assertJsonPath('name', 'Maria Souza Lima')
            // Os grupos não mudam por aqui: são alterados em "Editar vínculos".
            ->assertJsonPath('grupos', ['Lançamentos']);

        $atualizada = User::find($maria);
        $this->assertSame('maria.lima@exemplo.com', $atualizada->email);
        $this->assertTrue(Hash::check('outra-senha-forte', $atualizada->password));
    }

    public function test_altera_os_vinculos_do_usuario(): void
    {
        $this->criarTenant('demo');
        [, $token] = $this->entrar('demo', ['cadastros']);
        $maria = $this->cadastrar($token)->json('id');

        $this->withToken($token)->putJson("http://demo.localhost/api/usuarios/{$maria}/vinculos", [
            'grupos' => ['cadastros', 'Lançamentos'],
        ])->assertOk()->assertJsonPath('grupos', ['Lançamentos', 'cadastros']);
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->putJson("http://demo.localhost/api/usuarios/{$maria}/vinculos", ['grupos' => []])
            ->assertOk()
            ->assertJsonPath('grupos', []);
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->putJson("http://demo.localhost/api/usuarios/{$maria}/vinculos", [
            'grupos' => ['Fiscalização'],
        ])->assertUnprocessable()->assertJsonValidationErrors(['grupos.0']);
    }

    public function test_usuario_de_varias_prefeituras_so_tem_os_grupos_alterados(): void
    {
        $this->criarTenant('demo');
        $this->criarTenant('outra');
        [, $token] = $this->entrar('demo', ['cadastros']);
        $maria = User::factory()->create(['name' => 'Maria', 'cpf' => Cpf::gerar(), 'password' => 'senha-antiga']);
        $maria->tenants()->attach(['demo', 'outra']);

        $this->withToken($token)->putJson("http://demo.localhost/api/usuarios/{$maria->id}", [
            'name' => 'Outro nome',
            'email' => 'outro@exemplo.com',
            'password' => 'nova-senha-forte',
        ])->assertOk()->assertJsonPath('name', 'Maria');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        // Os grupos, esses sim, podem ser alterados aqui.
        $this->withToken($token)->putJson("http://demo.localhost/api/usuarios/{$maria->id}/vinculos", [
            'grupos' => ['Lançamentos'],
        ])->assertOk()->assertJsonPath('grupos', ['Lançamentos']);

        $maria->refresh();
        $this->assertSame('Maria', $maria->name);
        $this->assertTrue(Hash::check('senha-antiga', $maria->password));
    }

    public function test_remover_tira_o_acesso_a_prefeitura_sem_apagar_o_usuario(): void
    {
        $this->criarTenant('demo');
        $this->criarTenant('outra');
        [, $token] = $this->entrar('demo', ['cadastros']);
        $maria = User::factory()->create(['cpf' => Cpf::gerar(), 'password' => 'senha']);
        $maria->tenants()->attach(['demo', 'outra']);
        Tenant::find('demo')->run(fn () => $maria->assignRole('Lançamentos'));
        $tokenDela = $maria->createToken('web:demo')->plainTextToken;

        $this->withToken($token)->deleteJson("http://demo.localhost/api/usuarios/{$maria->id}")
            ->assertNoContent();
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $this->assertFalse($maria->fresh()->acessaTenant('demo'));
        $this->assertTrue($maria->fresh()->acessaTenant('outra'));
        Tenant::find('demo')->run(fn () => $this->assertEmpty($maria->fresh()->getRoleNames()));
        $this->withToken($tokenDela)->getJson('http://demo.localhost/api/me')->assertUnauthorized();
    }

    public function test_nao_remove_o_proprio_acesso(): void
    {
        $this->criarTenant('demo');
        [$eu, $token] = $this->entrar('demo', ['cadastros']);

        $this->withToken($token)->deleteJson("http://demo.localhost/api/usuarios/{$eu->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['usuario' => 'Você não pode remover o seu próprio acesso.']);
    }

    public function test_usuario_de_outra_prefeitura_responde_404(): void
    {
        $this->criarTenant('demo');
        $this->criarTenant('outra');
        [, $token] = $this->entrar('demo', ['cadastros']);
        [$deOutra] = $this->entrar('outra');

        $this->withToken($token)->putJson("http://demo.localhost/api/usuarios/{$deOutra->id}", [
            'name' => 'Nome', 'email' => 'x@exemplo.com',
        ])->assertNotFound();
    }

    public function test_sem_a_permissao_da_tela_nao_acessa(): void
    {
        $this->criarTenant('demo');
        [, $token] = $this->entrar('demo', ['Lançamentos'], administra: false);

        $this->withToken($token)->getJson('http://demo.localhost/api/usuarios')->assertForbidden();
        tenancy()->end();
        $this->app['auth']->forgetGuards();
        $this->cadastrar($token)->assertForbidden();
    }

    public function test_lista_os_grupos_da_prefeitura_para_o_formulario(): void
    {
        $this->criarTenant('demo');
        [, $token] = $this->entrar('demo', [], superadmin: true);

        $this->withToken($token)->getJson('http://demo.localhost/api/grupos')
            ->assertOk()
            ->assertJsonPath('data.0.nome', 'Administrador')
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.1.nome', 'Lançamentos')
            ->assertJsonPath('data.2.nome', 'cadastros');
    }
}
