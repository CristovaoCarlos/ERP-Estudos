<?php

namespace Tests\Feature;

use App\Models\Segmento;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SegmentoTest extends TestCase
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

    private function criarSegmentos(): void
    {
        Segmento::insert([
            ['codigo' => '9', 'descricao' => 'USO INTERNO DO BANCO'],
            ['codigo' => '1', 'descricao' => 'PREFEITURA'],
            ['codigo' => '2', 'descricao' => 'SANEAMENTO'],
        ]);
    }

    public function test_exige_a_permissao_da_tela(): void
    {
        $this->criarTenant();
        $this->criarSegmentos();
        $token = $this->entrar(['tabelas-comuns.selic']);

        $this->emLemarq($token, 'get', '/api/tabelas-comuns/segmentos')->assertForbidden();
        $this->emLemarq($token, 'put', '/api/tabelas-comuns/segmentos/1', ['descricao' => 'X'])->assertForbidden();
    }

    public function test_lista_ordenada_pelo_codigo(): void
    {
        $this->criarTenant();
        $this->criarSegmentos();
        $token = $this->entrar(['tabelas-comuns.segmentos']);

        $this->emLemarq($token, 'get', '/api/tabelas-comuns/segmentos')
            ->assertOk()
            ->assertJsonPath('data.*.codigo', ['1', '2', '9'])
            ->assertJsonPath('data.0.descricao', 'PREFEITURA');
    }

    public function test_altera_so_a_descricao(): void
    {
        $this->criarTenant();
        $this->criarSegmentos();
        $token = $this->entrar(['tabelas-comuns.segmentos']);

        $this->emLemarq($token, 'put', '/api/tabelas-comuns/segmentos/2', [
            'descricao' => ' SANEAMENTO BÁSICO ',
            'codigo' => '8',
        ])
            ->assertOk()
            ->assertJsonPath('codigo', '2')
            ->assertJsonPath('descricao', 'SANEAMENTO BÁSICO');

        $this->assertSame('SANEAMENTO BÁSICO', Segmento::find('2')->descricao);
        $this->assertNull(Segmento::find('8'));
    }

    public function test_valida_a_descricao_e_recusa_codigo_inexistente(): void
    {
        $this->criarTenant();
        $this->criarSegmentos();
        $token = $this->entrar(['tabelas-comuns.segmentos']);

        $this->emLemarq($token, 'put', '/api/tabelas-comuns/segmentos/1', ['descricao' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['descricao' => 'Informe a descrição.']);
        $this->emLemarq($token, 'put', '/api/tabelas-comuns/segmentos/1', ['descricao' => str_repeat('A', 51)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['descricao' => 'Use no máximo 50 caracteres.']);
        $this->emLemarq($token, 'put', '/api/tabelas-comuns/segmentos/7', ['descricao' => 'X'])
            ->assertNotFound();
    }
}
