<?php

namespace Tests\Feature;

use App\Models\Lcp116;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Lcp116Test extends TestCase
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

    private function criarItens(): void
    {
        Lcp116::insert([
            ['codigo' => '01.02', 'descricao' => 'Programação.'],
            ['codigo' => '01', 'descricao' => 'Serviços de informática e congêneres.'],
            ['codigo' => '01.01', 'descricao' => 'Análise e desenvolvimento de sistemas.'],
        ]);
    }

    public function test_lista_ordenada_pelo_codigo_com_o_tipo(): void
    {
        $this->criarTenant();
        $this->criarItens();
        $token = $this->entrar();

        $this->emLemarq($token, 'get', '/api/administracao/tabelas-comuns/lista-de-servicos')
            ->assertOk()
            ->assertJsonPath('data.*.codigo', ['01', '01.01', '01.02'])
            ->assertJsonPath('data.0.tipo', 'item')
            ->assertJsonPath('data.1.tipo', 'subitem');
    }

    public function test_altera_so_a_descricao(): void
    {
        $this->criarTenant();
        $this->criarItens();
        $token = $this->entrar();

        $this->emLemarq($token, 'put', '/api/administracao/tabelas-comuns/lista-de-servicos/01.02', [
            'descricao' => '  Programação de computadores.  ',
            'codigo' => '99',
        ])
            ->assertOk()
            ->assertJsonPath('codigo', '01.02')
            ->assertJsonPath('descricao', 'Programação de computadores.');

        $this->assertSame('Programação de computadores.', Lcp116::find('01.02')->descricao);
        $this->assertNull(Lcp116::find('99'));
    }

    public function test_exige_a_descricao_e_recusa_codigo_inexistente(): void
    {
        $this->criarTenant();
        $this->criarItens();
        $token = $this->entrar();

        $this->emLemarq($token, 'put', '/api/administracao/tabelas-comuns/lista-de-servicos/01.01', ['descricao' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['descricao' => 'Informe a descrição.']);
        $this->emLemarq($token, 'put', '/api/administracao/tabelas-comuns/lista-de-servicos/77.77', ['descricao' => 'X'])
            ->assertNotFound();
    }

    public function test_inclui_item_e_subitem(): void
    {
        $this->criarTenant();
        $this->criarItens();
        $token = $this->entrar();

        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/lista-de-servicos', ['codigo' => '02', 'descricao' => 'Pesquisas.'])
            ->assertCreated()
            ->assertJsonPath('tipo', 'item');
        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/lista-de-servicos', ['codigo' => '02.01', 'descricao' => 'Pesquisa e desenvolvimento.'])
            ->assertCreated()
            ->assertJsonPath('tipo', 'subitem');

        $this->assertSame('Pesquisa e desenvolvimento.', Lcp116::find('02.01')->descricao);
    }

    public function test_valida_a_inclusao_de_item(): void
    {
        $this->criarTenant();
        $this->criarItens();
        $token = $this->entrar();

        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/lista-de-servicos', ['codigo' => '01.01', 'descricao' => 'X'])
            ->assertJsonValidationErrors(['codigo' => 'Já existe um item com este código.']);
        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/lista-de-servicos', ['codigo' => '1.1', 'descricao' => 'X'])
            ->assertJsonValidationErrors(['codigo' => 'Use 01 para item ou 01.01 para subitem.']);
        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/lista-de-servicos', ['codigo' => '05.01', 'descricao' => 'X'])
            ->assertJsonValidationErrors(['codigo' => 'Cadastre antes o item 05.']);
    }
}
