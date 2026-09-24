<?php

namespace Tests\Feature;

use App\Models\Banco;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BancoTest extends TestCase
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

    public function test_lista_os_bancos_do_banco_central_por_nome(): void
    {
        $this->criarTenant();
        Banco::insert([
            ['codigo' => '0341', 'descricao' => 'Itaú Unibanco S.A.'],
            ['codigo' => '0001', 'descricao' => 'Banco do Brasil S.A.'],
        ]);
        $token = $this->entrar();

        $this->emLemarq($token, 'get', '/api/administracao/tabelas-comuns/bancos')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.codigo', '0001')
            ->assertJsonPath('data.0.nome', 'Banco do Brasil S.A.')
            ->assertJsonPath('data.1.nome', 'Itaú Unibanco S.A.');
    }

    public function test_inclui_banco(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/bancos', ['codigo' => '0077', 'nome' => 'Banco Inter S.A.'])
            ->assertCreated()
            ->assertJsonPath('codigo', '0077')
            ->assertJsonPath('nome', 'Banco Inter S.A.');

        $this->assertTrue(Banco::where('codigo', '0077')->exists());
    }

    public function test_valida_a_inclusao_de_banco(): void
    {
        $this->criarTenant();
        Banco::insert([['codigo' => '0001', 'descricao' => 'Banco do Brasil S.A.']]);
        $token = $this->entrar();

        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/bancos', ['codigo' => '0001', 'nome' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'codigo' => 'Já existe um banco com este código.',
                'nome' => 'Informe o nome.',
            ]);
        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/bancos', ['codigo' => '1', 'nome' => 'X'])
            ->assertJsonValidationErrors(['codigo' => 'O código tem 4 dígitos (com zeros à esquerda, ex.: 0001).']);
    }
}
