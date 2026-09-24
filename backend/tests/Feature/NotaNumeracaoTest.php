<?php

namespace Tests\Feature;

use App\Models\NotaNumeracao;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotaNumeracaoTest extends TestCase
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

    public function test_lista_ordenada_pelo_codigo(): void
    {
        $this->criarTenant();
        NotaNumeracao::insert([
            ['cod_numeracao' => 'N', 'descricao' => 'NORMAL'],
            ['cod_numeracao' => 'A', 'descricao' => 'AUTOMÁTICO'],
            ['cod_numeracao' => 'D', 'descricao' => 'POR DATA'],
        ]);
        $token = $this->entrar();

        $this->emLemarq($token, 'get', '/api/administracao/tabelas-comuns/numeracao-de-notas')
            ->assertOk()
            ->assertJsonPath('data.*.codigo', ['A', 'D', 'N'])
            ->assertJsonPath('data.0', ['codigo' => 'A', 'descricao' => 'AUTOMÁTICO']);
    }

    public function test_inclui_numeracao(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/numeracao-de-notas', ['codigo' => 'S', 'descricao' => 'POR SÉRIE'])
            ->assertCreated()
            ->assertJsonPath('codigo', 'S');

        $this->assertSame('POR SÉRIE', NotaNumeracao::find('S')->descricao);
    }

    public function test_valida_a_inclusao_de_numeracao(): void
    {
        $this->criarTenant();
        NotaNumeracao::insert([['cod_numeracao' => 'A', 'descricao' => 'AUTOMÁTICO']]);
        $token = $this->entrar();

        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/numeracao-de-notas', ['codigo' => 'A', 'descricao' => str_repeat('X', 21)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'codigo' => 'Já existe uma numeração com este código.',
                'descricao' => 'Use no máximo 20 caracteres.',
            ]);
        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/numeracao-de-notas', ['codigo' => 'a', 'descricao' => 'X'])
            ->assertJsonValidationErrors(['codigo' => 'O código é uma letra maiúscula.']);
    }
}
