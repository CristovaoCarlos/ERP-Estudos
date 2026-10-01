<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
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
        $tenant = Tenant::create(['id' => $id]);
        $tenant->domains()->create(['domain' => "{$id}.localhost"]);

        return $this->tenants[] = $tenant;
    }

    private function criarUsuario(Tenant ...$tenants): User
    {
        $user = User::factory()->create(['name' => 'Teste', 'cpf' => '52998224725', 'email' => 'fiscal@stm.localhost', 'password' => 'senha-correta']);
        $user->tenants()->attach(array_map(fn (Tenant $t) => $t->id, $tenants));

        return $user;
    }

    private function login(string $tenant, string $senha = 'senha-correta', string $cpf = '529.982.247-25')
    {
        return $this->postJson("http://{$tenant}.localhost/api/login", [
            'cpf' => $cpf,
            'password' => $senha,
        ]);
    }

    public function test_usuario_vinculado_faz_login_e_acessa_me(): void
    {
        $this->criarUsuario($this->criarTenant('demo'));

        $token = $this->login('demo')
            ->assertOk()
            ->assertJsonPath('usuario.cpf', '52998224725')
            ->assertJsonMissingPath('usuario.password')
            ->json('token');

        $this->withToken($token)->getJson('http://demo.localhost/api/me')
            ->assertOk()
            ->assertJsonPath('email', 'fiscal@stm.localhost');
    }

    public function test_me_lista_as_prefeituras_do_usuario_com_dominio(): void
    {
        $this->criarUsuario($this->criarTenant('demo'), $this->criarTenant('outra'));
        $this->criarTenant('sem_vinculo');

        $token = $this->login('demo')
            ->assertJsonPath('usuario.prefeituras.0.id', 'demo')
            ->json('token');

        $this->withToken($token)->getJson('http://demo.localhost/api/me')
            ->assertExactJson([
                'id' => 1,
                'name' => 'Teste',
                'cpf' => '52998224725',
                'email' => 'fiscal@stm.localhost',
                'foto' => null,
                'superadmin' => false,
                'grupos' => [],
                'permissoes' => [],
                'prefeituras' => [
                    ['id' => 'demo', 'nome' => null, 'dominio' => 'demo.localhost'],
                    ['id' => 'outra', 'nome' => null, 'dominio' => 'outra.localhost'],
                ],
            ]);
    }

    public function test_senha_errada_e_recusada(): void
    {
        $this->criarUsuario($this->criarTenant('demo'));

        $this->login('demo', 'senha-errada')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cpf' => 'CPF ou senha inválidos.']);
    }

    public function test_aceita_cpf_sem_mascara(): void
    {
        $this->criarUsuario($this->criarTenant('demo'));

        $this->login('demo', cpf: '52998224725')->assertOk();
    }

    public function test_cpf_invalido_e_recusado(): void
    {
        $this->criarUsuario($this->criarTenant('demo'));

        $this->login('demo', cpf: '529.982.247-26')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cpf' => 'Informe um CPF válido.']);
    }

    public function test_email_nao_serve_mais_para_login(): void
    {
        $this->criarUsuario($this->criarTenant('demo'));

        $this->postJson('http://demo.localhost/api/login', [
            'email' => 'fiscal@stm.localhost',
            'password' => 'senha-correta',
        ])->assertUnprocessable()->assertJsonValidationErrors(['cpf']);
    }

    public function test_usuario_sem_vinculo_com_o_tenant_nao_faz_login(): void
    {
        $this->criarUsuario($this->criarTenant('demo'));
        $this->criarTenant('outra');

        $this->login('outra')->assertUnprocessable();
    }

    public function test_token_de_um_tenant_nao_acessa_tenant_sem_vinculo(): void
    {
        $this->criarUsuario($this->criarTenant('demo'));
        $this->criarTenant('outra');

        $token = $this->login('demo')->json('token');
        tenancy()->end();

        $this->withToken($token)->getJson('http://outra.localhost/api/me')->assertForbidden();
    }

    public function test_logout_revoga_o_token(): void
    {
        $this->criarUsuario($this->criarTenant('demo'));
        $token = $this->login('demo')->json('token');

        $this->withToken($token)->postJson('http://demo.localhost/api/logout')->assertNoContent();

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('http://demo.localhost/api/me')->assertUnauthorized();
    }

    public function test_me_exige_autenticacao(): void
    {
        $this->criarTenant('demo');

        $this->getJson('http://demo.localhost/api/me')->assertUnauthorized();
    }

    public function test_prefeitura_inexistente_responde_404(): void
    {
        $this->getJson('http://nao-existe.localhost/api/tenant')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Prefeitura não encontrada.']);
    }

    public function test_usuario_troca_a_propria_senha_e_derruba_as_outras_sessoes(): void
    {
        $this->criarUsuario($this->criarTenant('demo'));
        $token = $this->login('demo')->json('token');
        tenancy()->end();
        $outraSessao = User::first()->createToken('web:demo')->plainTextToken;

        $this->withToken($token)->putJson('http://demo.localhost/api/me/senha', [
            'senha_atual' => 'senha-correta',
            'password' => 'senha-nova-forte',
            'password_confirmation' => 'senha-nova-forte',
        ])->assertOk()->assertJsonPath('message', 'Senha alterada.');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        // A sessão que trocou a senha continua; as outras caem.
        $this->withToken($token)->getJson('http://demo.localhost/api/me')->assertOk();
        tenancy()->end();
        $this->app['auth']->forgetGuards();
        $this->withToken($outraSessao)->getJson('http://demo.localhost/api/me')->assertUnauthorized();
        tenancy()->end();

        $this->login('demo', 'senha-nova-forte')->assertOk();
    }

    public function test_troca_de_senha_exige_a_senha_atual_e_confirmacao(): void
    {
        $this->criarUsuario($this->criarTenant('demo'));
        $token = $this->login('demo')->json('token');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->putJson('http://demo.localhost/api/me/senha', [
            'senha_atual' => 'senha-errada',
            'password' => 'senha-nova-forte',
            'password_confirmation' => 'senha-nova-forte',
        ])->assertUnprocessable()->assertJsonValidationErrors(['senha_atual' => 'Senha atual incorreta.']);
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->putJson('http://demo.localhost/api/me/senha', [
            'senha_atual' => 'senha-correta',
            'password' => 'senha-nova-forte',
            'password_confirmation' => 'outra',
        ])->assertJsonValidationErrors(['password']);
    }

    public function test_login_e_limitado_apos_cinco_tentativas(): void
    {
        $this->criarUsuario($this->criarTenant('demo'));

        for ($i = 0; $i < 5; $i++) {
            $this->login('demo', 'senha-errada')->assertUnprocessable();
        }

        $this->login('demo')->assertTooManyRequests();
    }
}
