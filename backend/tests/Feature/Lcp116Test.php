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

    public function test_exige_a_permissao_da_tela(): void
    {
        $this->criarTenant();
        $this->criarItens();
        $token = $this->entrar(['tabelas-comuns.cnae']);

        $this->emLemarq($token, 'get', '/api/tabelas-comuns/lista-de-servicos')->assertForbidden();
        $this->emLemarq($token, 'put', '/api/tabelas-comuns/lista-de-servicos/01.01', ['descricao' => 'X'])
            ->assertForbidden();
    }

    public function test_lista_ordenada_pelo_codigo_com_o_tipo(): void
    {
        $this->criarTenant();
        $this->criarItens();
        $token = $this->entrar(['tabelas-comuns.lista-de-servicos']);

        $this->emLemarq($token, 'get', '/api/tabelas-comuns/lista-de-servicos')
            ->assertOk()
            ->assertJsonPath('data.*.codigo', ['01', '01.01', '01.02'])
            ->assertJsonPath('data.0.tipo', 'item')
            ->assertJsonPath('data.1.tipo', 'subitem');
    }

    public function test_altera_so_a_descricao(): void
    {
        $this->criarTenant();
        $this->criarItens();
        $token = $this->entrar(['tabelas-comuns.lista-de-servicos']);

        $this->emLemarq($token, 'put', '/api/tabelas-comuns/lista-de-servicos/01.02', [
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
        $token = $this->entrar(['tabelas-comuns.lista-de-servicos']);

        $this->emLemarq($token, 'put', '/api/tabelas-comuns/lista-de-servicos/01.01', ['descricao' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['descricao' => 'Informe a descrição.']);
        $this->emLemarq($token, 'put', '/api/tabelas-comuns/lista-de-servicos/77.77', ['descricao' => 'X'])
            ->assertNotFound();
    }
}
