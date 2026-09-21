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
        $user = User::factory()->create(['email' => 'fiscal@stm.localhost', 'password' => 'senha-correta']);
        $user->tenants()->attach(array_map(fn (Tenant $t) => $t->id, $tenants));

        return $user;
    }

    private function login(string $tenant, string $senha = 'senha-correta')
    {
        return $this->postJson("http://{$tenant}.localhost/api/login", [
            'email' => 'fiscal@stm.localhost',
            'password' => $senha,
        ]);
    }

    public function test_usuario_vinculado_faz_login_e_acessa_me(): void
    {
        $this->criarUsuario($this->criarTenant('lemarq'));

        $token = $this->login('lemarq')
            ->assertOk()
            ->assertJsonPath('usuario.email', 'fiscal@stm.localhost')
            ->assertJsonMissingPath('usuario.password')
            ->json('token');

        $this->withToken($token)->getJson('http://lemarq.localhost/api/me')
            ->assertOk()
            ->assertJsonPath('email', 'fiscal@stm.localhost');
    }

    public function test_senha_errada_e_recusada(): void
    {
        $this->criarUsuario($this->criarTenant('lemarq'));

        $this->login('lemarq', 'senha-errada')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'E-mail ou senha inválidos.']);
    }

    public function test_usuario_sem_vinculo_com_o_tenant_nao_faz_login(): void
    {
        $this->criarUsuario($this->criarTenant('lemarq'));
        $this->criarTenant('outra');

        $this->login('outra')->assertUnprocessable();
    }

    public function test_token_de_um_tenant_nao_acessa_tenant_sem_vinculo(): void
    {
        $this->criarUsuario($this->criarTenant('lemarq'));
        $this->criarTenant('outra');

        $token = $this->login('lemarq')->json('token');
        tenancy()->end();

        $this->withToken($token)->getJson('http://outra.localhost/api/me')->assertForbidden();
    }

    public function test_logout_revoga_o_token(): void
    {
        $this->criarUsuario($this->criarTenant('lemarq'));
        $token = $this->login('lemarq')->json('token');

        $this->withToken($token)->postJson('http://lemarq.localhost/api/logout')->assertNoContent();

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('http://lemarq.localhost/api/me')->assertUnauthorized();
    }

    public function test_me_exige_autenticacao(): void
    {
        $this->criarTenant('lemarq');

        $this->getJson('http://lemarq.localhost/api/me')->assertUnauthorized();
    }

    public function test_login_e_limitado_apos_cinco_tentativas(): void
    {
        $this->criarUsuario($this->criarTenant('lemarq'));

        for ($i = 0; $i < 5; $i++) {
            $this->login('lemarq', 'senha-errada')->assertUnprocessable();
        }

        $this->login('lemarq')->assertTooManyRequests();
    }
}
