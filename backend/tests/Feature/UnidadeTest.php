<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\Unidade;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Administração › Tabelas Comuns › Unidades (banco central, só o superadmin). */
class UnidadeTest extends TestCase
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

    private function criarTenant(string $id = 'demo'): Tenant
    {
        $tenant = Tenant::create(['id' => $id, 'nome' => "Prefeitura {$id}"]);
        $tenant->domains()->create(['domain' => "{$id}.localhost"]);

        return $tenant;
    }

    /** Token do superadmin entrando pela Demo: as Tabelas Comuns são só dele. */
    private function entrar(): string
    {
        $user = User::factory()->create(['password' => 'senha', 'superadmin' => true]);
        $user->tenants()->attach('demo');

        $token = $this->postJson('http://demo.localhost/api/login', [
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

    public function test_a_tabela_ja_nasce_com_as_unidades_mais_usadas(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'get', '/api/administracao/tabelas-comuns/unidades')
            ->assertOk()
            ->assertJsonCount(13, 'data')
            ->assertJsonPath('data.0', ['sigla' => 'CX', 'descricao' => 'Caixa'])
            ->assertJsonFragment(['sigla' => 'UN', 'descricao' => 'Unidade']);
    }

    public function test_inclui_unidade_com_a_sigla_em_maiuscula(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/administracao/tabelas-comuns/unidades', ['sigla' => ' fd ', 'descricao' => 'Fardo'])
            ->assertCreated()
            ->assertExactJson(['sigla' => 'FD', 'descricao' => 'Fardo']);

        $this->assertSame('Fardo', Unidade::find('FD')->descricao);
    }

    public function test_valida_a_inclusao(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/administracao/tabelas-comuns/unidades', ['sigla' => 'un', 'descricao' => 'Outra'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sigla' => 'Já existe uma unidade com esta sigla.']);

        $this->emDemo($token, 'post', '/api/administracao/tabelas-comuns/unidades', ['sigla' => 'M 2', 'descricao' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'sigla' => 'Use de 1 a 6 letras ou números, sem espaço (ex.: UN, KG, M2).',
                'descricao' => 'Informe a descrição.',
            ]);
    }

    public function test_altera_so_a_descricao(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'put', '/api/administracao/tabelas-comuns/unidades/PC', ['sigla' => 'XX', 'descricao' => 'Peça avulsa'])
            ->assertOk()
            ->assertExactJson(['sigla' => 'PC', 'descricao' => 'Peça avulsa']);

        $this->assertNull(Unidade::find('XX'));
    }

    public function test_produto_so_aceita_unidade_cadastrada(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $this->emDemo($token, 'post', '/api/administracao/tabelas-comuns/unidades', ['sigla' => 'FD', 'descricao' => 'Fardo']);
        $produto = fn (string $unidade) => [
            'codigo' => 'P-'.$unidade, 'descricao' => 'Produto', 'unidade' => $unidade,
            'precos' => ['venda' => 10], 'estoque' => ['controla' => false],
            'fiscal' => ['origem' => 0], 'ativo' => true,
        ];

        $this->emDemo($token, 'post', '/api/cadastros/produtos', $produto('FD'))->assertCreated();
        $this->emDemo($token, 'post', '/api/cadastros/produtos', $produto('ZZ'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['unidade' => 'Escolha uma unidade da lista.']);
    }
}
