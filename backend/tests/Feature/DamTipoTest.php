<?php

namespace Tests\Feature;

use App\Models\DamTipo;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DamTipoTest extends TestCase
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
        DamTipo::insert([
            ['cod_dam_tipo' => 3, 'descricao' => 'IPTU'],
            ['cod_dam_tipo' => 1, 'descricao' => 'NOTA FISCAL'],
            ['cod_dam_tipo' => 2, 'descricao' => 'ALVARÁ'],
        ]);
        $token = $this->entrar();

        $this->emLemarq($token, 'get', '/api/administracao/tabelas-comuns/tipos-de-dam')
            ->assertOk()
            ->assertJsonPath('data.*.codigo', [1, 2, 3])
            ->assertJsonPath('data.0', ['codigo' => 1, 'descricao' => 'NOTA FISCAL']);
    }

    public function test_inclui_tipo_de_dam(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/tipos-de-dam', ['codigo' => 8, 'descricao' => 'MULTAS'])
            ->assertCreated()
            ->assertJsonPath('codigo', 8);

        $this->assertSame('MULTAS', DamTipo::find(8)->descricao);
    }

    public function test_valida_a_inclusao_de_tipo_de_dam(): void
    {
        $this->criarTenant();
        DamTipo::insert([['cod_dam_tipo' => 1, 'descricao' => 'NOTA FISCAL']]);
        $token = $this->entrar();

        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/tipos-de-dam', ['codigo' => 1, 'descricao' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'codigo' => 'Já existe um tipo de DAM com este código.',
                'descricao' => 'Informe a descrição.',
            ]);
        $this->emLemarq($token, 'post', '/api/administracao/tabelas-comuns/tipos-de-dam', ['codigo' => 0, 'descricao' => 'X'])
            ->assertJsonValidationErrors(['codigo' => 'Use um código de 1 a 9999.']);
    }
}
