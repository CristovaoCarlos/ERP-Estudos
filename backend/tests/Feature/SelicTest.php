<?php

namespace Tests\Feature;

use App\Models\Selic;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SelicTest extends TestCase
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

    private function criarTenant(string $id = 'lemarq'): Tenant
    {
        $tenant = Tenant::create(['id' => $id, 'nome' => "Prefeitura {$id}"]);
        $tenant->domains()->create(['domain' => "{$id}.localhost"]);

        return $tenant;
    }

    /** Token de um usuário com as permissões de tela informadas. */
    private function entrar(array $permissoes, string $tenant = 'lemarq'): string
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

    private function emLemarq(string $token, string $url)
    {
        $resposta = $this->withToken($token)->getJson("http://lemarq.localhost{$url}");
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $resposta;
    }

    public function test_exige_a_permissao_da_tela(): void
    {
        $this->criarTenant();
        $token = $this->entrar(['tabelas-comuns.cidades']);

        $this->emLemarq($token, '/api/tabelas-comuns/selic')->assertForbidden();
    }

    public function test_lista_do_mes_mais_recente_ao_mais_antigo(): void
    {
        $this->criarTenant();
        Selic::insert([
            ['id' => 1, 'ano' => 2025, 'mes' => 12, 'valor' => 1.12],
            ['id' => 2, 'ano' => 2026, 'mes' => 1, 'valor' => 1.16],
            ['id' => 3, 'ano' => 2026, 'mes' => 2, 'valor' => null],
        ]);
        $token = $this->entrar(['tabelas-comuns.selic']);

        $this->emLemarq($token, '/api/tabelas-comuns/selic')
            ->assertOk()
            ->assertJsonPath('data.*.id', [3, 2, 1])
            ->assertJsonPath('data.0.valor', null)
            ->assertJsonPath('data.1', ['id' => 2, 'ano' => 2026, 'mes' => 1, 'valor' => '1.16']);
    }
}
