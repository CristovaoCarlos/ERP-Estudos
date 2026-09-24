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

    private function criarSegmentos(): void
    {
        Segmento::insert([
            ['codigo' => '9', 'descricao' => 'USO INTERNO DO BANCO'],
            ['codigo' => '1', 'descricao' => 'PREFEITURA'],
            ['codigo' => '2', 'descricao' => 'SANEAMENTO'],
        ]);
    }

    public function test_lista_ordenada_pelo_codigo(): void
    {
        $this->criarTenant();
        $this->criarSegmentos();
        $token = $this->entrar();

        $this->emLemarq($token, 'get', '/api/administracao/tabelas-comuns/segmentos')
            ->assertOk()
            ->assertJsonPath('data.*.codigo', ['1', '2', '9'])
            ->assertJsonPath('data.0.descricao', 'PREFEITURA');
    }

    public function test_altera_so_a_descricao(): void
    {
        $this->criarTenant();
        $this->criarSegmentos();
        $token = $this->entrar();

        $this->emLemarq($token, 'put', '/api/administracao/tabelas-comuns/segmentos/2', [
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
        $token = $this->entrar();

        $this->emLemarq($token, 'put', '/api/administracao/tabelas-comuns/segmentos/1', ['descricao' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['descricao' => 'Informe a descrição.']);
        $this->emLemarq($token, 'put', '/api/administracao/tabelas-comuns/segmentos/1', ['descricao' => str_repeat('A', 51)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['descricao' => 'Use no máximo 50 caracteres.']);
        $this->emLemarq($token, 'put', '/api/administracao/tabelas-comuns/segmentos/7', ['descricao' => 'X'])
            ->assertNotFound();
    }

    public function test_inclui_segmento(): void
    {
        $this->criarTenant();
        $this->criarSegmentos();
        $token = $this->entrar();

        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/segmentos', ['codigo' => '4', 'descricao' => 'TELECOMUNICACOES'])
            ->assertCreated()
            ->assertJsonPath('codigo', '4');

        $this->assertSame('TELECOMUNICACOES', Segmento::find('4')->descricao);
    }

    public function test_valida_a_inclusao_de_segmento(): void
    {
        $this->criarTenant();
        $this->criarSegmentos();
        $token = $this->entrar();

        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/segmentos', ['codigo' => '1', 'descricao' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'codigo' => 'Já existe um segmento com este código.',
                'descricao' => 'Informe a descrição.',
            ]);
        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/segmentos', ['codigo' => 'A', 'descricao' => 'X'])
            ->assertJsonValidationErrors(['codigo' => 'O código é um dígito, de 0 a 9.']);
    }
}
