<?php

namespace Tests\Feature;

use App\Models\Cnae;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CnaeTest extends TestCase
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

    public function test_lista_na_ordem_da_hierarquia_com_nivel_e_codigo(): void
    {
        $this->criarTenant();
        $linha = fn (array $dados) => array_merge(['divisao' => '', 'grupo' => '', 'classe' => '', 'subclasse' => '', 'versao' => '2.3', 'ativo' => true], $dados);
        Cnae::insert([
            $linha(['sessao' => 'P', 'divisao' => '85', 'grupo' => '85.9', 'classe' => '85.93-7', 'subclasse' => '8593-7/00', 'denominacao' => 'Ensino de idiomas']),
            $linha(['sessao' => 'P', 'denominacao' => 'EDUCAÇÃO']),
            $linha(['sessao' => 'P', 'divisao' => '85', 'grupo' => null, 'classe' => null, 'subclasse' => null, 'denominacao' => 'EDUCAÇÃO']),
            $linha(['sessao' => 'A', 'denominacao' => 'AGRICULTURA', 'versao' => '2.2', 'ativo' => false]),
        ]);
        $token = $this->entrar();

        $this->emDemo($token, 'get', '/api/administracao/tabelas-comuns/cnae')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('data.0.nivel', 'secao')
            ->assertJsonPath('data.0.codigo', 'P')
            ->assertJsonPath('data.1.nivel', 'divisao')
            ->assertJsonPath('data.1.grupo', null)
            ->assertJsonPath('data.2.nivel', 'subclasse')
            ->assertJsonPath('data.2.codigo', '8593-7/00')
            ->assertJsonPath('data.2.classe', '85.93-7')
            ->assertJsonPath('data.3.versao', '2.2')
            ->assertJsonPath('data.3.ativo', false);
    }

    public function test_inclui_subclasse(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/administracao/tabelas-comuns/cnae', [
            'secao' => 'P',
            'divisao' => '85',
            'grupo' => '85.9',
            'classe' => '85.93-7',
            'subclasse' => '8593-7/00',
            'denominacao' => 'Ensino de idiomas',
            'versao' => '2.3',
        ])
            ->assertCreated()
            ->assertJsonPath('nivel', 'subclasse')
            ->assertJsonPath('codigo', '8593-7/00')
            ->assertJsonPath('ativo', true);

        $this->assertSame('P', Cnae::first()->sessao);
    }

    public function test_valida_formato_e_hierarquia(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/administracao/tabelas-comuns/cnae', ['secao' => 'Z', 'grupo' => '85.9', 'denominacao' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'secao' => 'A seção é uma letra de A a U.',
                'divisao' => 'Informe este nível: o nível abaixo dele foi preenchido.',
                'denominacao' => 'Informe a denominação.',
            ]);
        $this->emDemo($token, 'post', '/api/administracao/tabelas-comuns/cnae', [
            'secao' => 'P', 'divisao' => '85', 'grupo' => '86.1', 'denominacao' => 'X',
        ])->assertJsonValidationErrors(['grupo' => 'O código precisa começar pelo código do nível de cima.']);
        $this->emDemo($token, 'post', '/api/administracao/tabelas-comuns/cnae', [
            'secao' => 'P', 'divisao' => '85', 'grupo' => '85.9', 'classe' => '8593-7', 'denominacao' => 'X',
        ])->assertJsonValidationErrors(['classe' => 'A classe segue o formato 85.93-7.']);
    }
}
