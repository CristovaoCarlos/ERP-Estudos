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

    /** Token do superadmin entrando pela Lemarq: as Tabelas Comuns são só dele. */
    private function entrar(): string
    {
        $user = User::factory()->create(['password' => 'senha', 'superadmin' => true]);
        $user->tenants()->attach('lemarq');

        $token = $this->postJson('http://lemarq.localhost/api/login', [
            'cpf' => $user->cpf,
            'password' => 'senha',
        ])->assertOk()->json('token');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $token;
    }

    private function emLemarq(string $token, string $metodo, string $url, array $dados = [])
    {
        $resposta = $this->withToken($token)->json($metodo, "http://lemarq.localhost{$url}", $dados);
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $resposta;
    }

    public function test_lista_do_mes_mais_recente_ao_mais_antigo(): void
    {
        $this->criarTenant();
        Selic::insert([
            ['id' => 1, 'ano' => 2025, 'mes' => 12, 'valor' => 1.12],
            ['id' => 2, 'ano' => 2026, 'mes' => 1, 'valor' => 1.16],
            ['id' => 3, 'ano' => 2026, 'mes' => 2, 'valor' => null],
        ]);
        $token = $this->entrar();

        $this->emLemarq($token, 'get', '/api/administracao/tabelas-comuns/selic')
            ->assertOk()
            ->assertJsonPath('data.*.id', [3, 2, 1])
            ->assertJsonPath('data.0.valor', null)
            ->assertJsonPath('data.1', ['id' => 2, 'ano' => 2026, 'mes' => 1, 'valor' => '1.16']);
    }

    public function test_inclui_mes_com_o_proximo_id(): void
    {
        $this->criarTenant();
        Selic::insert([['id' => 4, 'ano' => 2026, 'mes' => 1, 'valor' => 1.16]]);
        $token = $this->entrar();

        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/selic', ['ano' => 2026, 'mes' => 2, 'valor' => '0.99'])
            ->assertCreated()
            ->assertJsonPath('id', 5)
            ->assertJsonPath('valor', '0.99');
    }

    public function test_valida_a_inclusao_de_mes(): void
    {
        $this->criarTenant();
        Selic::insert([['id' => 1, 'ano' => 2026, 'mes' => 1, 'valor' => 1.16]]);
        $token = $this->entrar();

        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/selic', ['ano' => 2026, 'mes' => 1, 'valor' => '-1'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'mes' => 'Este mês já tem taxa cadastrada.',
                'valor' => 'A taxa não pode ser negativa.',
            ]);
        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/selic', ['ano' => 2025, 'mes' => 13, 'valor' => '1.234'])
            ->assertJsonValidationErrors(['mes' => 'Mês inválido.', 'valor' => 'Use no máximo 2 casas decimais.']);
    }
}
