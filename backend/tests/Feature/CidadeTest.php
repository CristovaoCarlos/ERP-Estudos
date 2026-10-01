<?php

namespace Tests\Feature;

use App\Models\Cidade;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CidadeTest extends TestCase
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

    public function test_lista_as_cidades_do_banco_central_por_uf_e_nome(): void
    {
        $this->criarTenant();
        Cidade::insert([
            ['id_cidade' => 1, 'codigo' => '3550308', 'descricao' => 'São Paulo', 'uf' => 'SP'],
            ['id_cidade' => 2, 'codigo' => '1100015', 'descricao' => "Alta Floresta D'Oeste", 'uf' => 'RO'],
            ['id_cidade' => 3, 'codigo' => '3509502', 'descricao' => 'Campinas', 'uf' => 'SP'],
        ]);
        $token = $this->entrar();

        $this->emDemo($token, 'get', '/api/administracao/tabelas-comuns/cidades')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0', ['id' => 2, 'codigo_ibge' => '1100015', 'nome' => "Alta Floresta D'Oeste", 'uf' => 'RO'])
            ->assertJsonPath('data.1.nome', 'Campinas')
            ->assertJsonPath('data.2.nome', 'São Paulo');
    }

    public function test_inclui_cidade_com_o_proximo_id(): void
    {
        $this->criarTenant();
        Cidade::insert([['id_cidade' => 7, 'codigo' => '3550308', 'descricao' => 'São Paulo', 'uf' => 'SP']]);
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/administracao/tabelas-comuns/cidades', [
            'codigo_ibge' => '3509502',
            'nome' => ' Campinas ',
            'uf' => 'SP',
        ])
            ->assertCreated()
            ->assertJsonPath('id', 8)
            ->assertJsonPath('nome', 'Campinas');

        $this->assertSame('Campinas', Cidade::find(8)->descricao);
    }

    public function test_valida_a_inclusao_de_cidade(): void
    {
        $this->criarTenant();
        Cidade::insert([['id_cidade' => 1, 'codigo' => '3550308', 'descricao' => 'São Paulo', 'uf' => 'SP']]);
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/administracao/tabelas-comuns/cidades', ['codigo_ibge' => '3550308', 'nome' => '', 'uf' => 'XX'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'codigo_ibge' => 'Já existe uma cidade com este código do IBGE.',
                'nome' => 'Informe o nome.',
                'uf' => 'UF inválida.',
            ]);
        $this->emDemo($token, 'post', '/api/administracao/tabelas-comuns/cidades', ['codigo_ibge' => '123', 'nome' => 'X', 'uf' => 'SP'])
            ->assertJsonValidationErrors(['codigo_ibge' => 'O código do IBGE tem 7 dígitos.']);
    }

    public function test_altera_nome_e_uf_sem_mudar_o_codigo_ibge(): void
    {
        $this->criarTenant();
        Cidade::insert([['id_cidade' => 5, 'codigo' => '3550308', 'descricao' => 'Sao Paulo', 'uf' => 'RJ']]);
        $token = $this->entrar();

        $this->emDemo($token, 'put', '/api/administracao/tabelas-comuns/cidades/5', [
            'nome' => ' São Paulo ',
            'uf' => 'SP',
            'codigo_ibge' => '9999999',
        ])
            ->assertOk()
            ->assertJsonPath('nome', 'São Paulo')
            ->assertJsonPath('uf', 'SP')
            ->assertJsonPath('codigo_ibge', '3550308');

        $this->assertSame('3550308', Cidade::find(5)->codigo);
    }

    public function test_valida_a_alteracao_e_recusa_cidade_inexistente(): void
    {
        $this->criarTenant();
        Cidade::insert([['id_cidade' => 5, 'codigo' => '3550308', 'descricao' => 'São Paulo', 'uf' => 'SP']]);
        $token = $this->entrar();

        $this->emDemo($token, 'put', '/api/administracao/tabelas-comuns/cidades/5', ['nome' => '', 'uf' => 'XX'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['nome' => 'Informe o nome.', 'uf' => 'UF inválida.']);
        $this->emDemo($token, 'put', '/api/administracao/tabelas-comuns/cidades/99', ['nome' => 'X', 'uf' => 'SP'])
            ->assertNotFound();
    }
}
