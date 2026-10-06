<?php

namespace Tests\Feature;

use App\Models\PersonalAccessToken;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Logout automático: token sem uso há mais que o prazo de inatividade é recusado (ADR-0017). */
class SessaoTest extends TestCase
{
    use RefreshDatabase;

    private ?Tenant $tenant = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create(['id' => 'demo']);
        $this->tenant->domains()->create(['domain' => 'demo.localhost']);
    }

    protected function tearDown(): void
    {
        tenancy()->end();
        $this->tenant?->delete();

        parent::tearDown();
    }

    /** @return array{0: string, 1: PersonalAccessToken} */
    private function criarToken(): array
    {
        $user = User::factory()->create(['cpf' => '52998224725', 'password' => 'senha-correta']);
        $user->tenants()->attach('demo');
        $novo = $user->createToken('web:demo');

        return [$novo->plainTextToken, $novo->accessToken];
    }

    public function test_token_usado_dentro_do_prazo_continua_valido(): void
    {
        [$token, $registro] = $this->criarToken();
        $registro->forceFill(['last_used_at' => now()->subMinutes(4)])->save();

        $this->withToken($token)->getJson('http://demo.localhost/api/me')->assertOk();
    }

    public function test_token_ocioso_alem_do_prazo_e_recusado_e_apagado(): void
    {
        [$token, $registro] = $this->criarToken();
        $registro->forceFill(['last_used_at' => now()->subMinutes(6)])->save();

        $this->withToken($token)->getJson('http://demo.localhost/api/me')->assertUnauthorized();
        $this->assertModelMissing($registro);
    }

    public function test_token_nunca_usado_conta_o_prazo_desde_a_criacao(): void
    {
        [$token, $registro] = $this->criarToken();
        $registro->forceFill(['created_at' => now()->subMinutes(6), 'last_used_at' => null])->save();

        $this->withToken($token)->getJson('http://demo.localhost/api/me')->assertUnauthorized();
    }

    public function test_prazo_vem_da_configuracao(): void
    {
        config(['sessao.inatividade_minutos' => 10]);
        [$token, $registro] = $this->criarToken();
        $registro->forceFill(['last_used_at' => now()->subMinutes(6)])->save();

        $this->withToken($token)->getJson('http://demo.localhost/api/me')
            ->assertOk()
            ->assertJsonPath('inatividade_minutos', 10);
    }

    public function test_renovar_atualiza_o_ultimo_uso_do_token(): void
    {
        [$token, $registro] = $this->criarToken();
        $registro->forceFill(['last_used_at' => now()->subMinutes(4)])->save();

        $this->withToken($token)->postJson('http://demo.localhost/api/sessao/renovar')->assertNoContent();

        $this->assertTrue($registro->fresh()->last_used_at->gt(now()->subMinute()));
    }

    public function test_renovar_sem_token_e_recusado(): void
    {
        $this->postJson('http://demo.localhost/api/sessao/renovar')->assertUnauthorized();
    }

    public function test_login_informa_o_prazo_de_inatividade(): void
    {
        $this->criarToken();

        $this->postJson('http://demo.localhost/api/login', ['cpf' => '529.982.247-25', 'password' => 'senha-correta'])
            ->assertOk()
            ->assertJsonPath('usuario.inatividade_minutos', 5);
    }
}
