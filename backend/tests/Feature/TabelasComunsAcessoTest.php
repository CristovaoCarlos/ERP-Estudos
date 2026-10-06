<?php

namespace Tests\Feature;

use App\Models\Cidade;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Acesso;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tabelas Comuns gravam no banco central e valem para todas as prefeituras: só o superadmin,
 * entrando pela Demo, as acessa. Nem o grupo Administrador de uma prefeitura.
 */
class TabelasComunsAcessoTest extends TestCase
{
    use RefreshDatabase;

    /** Todas as rotas do módulo: método, caminho. */
    private const ROTAS = [
        ['get', 'cidades'], ['post', 'cidades'], ['put', 'cidades/1'],
        ['get', 'unidades'], ['post', 'unidades'], ['put', 'unidades/UN'],
    ];

    protected function tearDown(): void
    {
        tenancy()->end();
        foreach (Tenant::all() as $tenant) {
            $tenant->delete();
        }

        parent::tearDown();
    }

    private function criarTenant(string $id): void
    {
        // Registro da rota de alteração: sem ele o Laravel responderia 404 antes de checar o acesso.
        if (! Cidade::whereKey(1)->exists()) {
            Cidade::insert([['id_cidade' => 1, 'codigo' => '3550308', 'descricao' => 'São Paulo', 'uf' => 'SP']]);
        }

        $tenant = Tenant::create(['id' => $id, 'nome' => "Prefeitura {$id}"]);
        $tenant->domains()->create(['domain' => "{$id}.localhost"]);
    }

    private function entrar(string $tenant, bool $superadmin, array $grupos = []): string
    {
        $user = User::factory()->create(['password' => 'senha', 'superadmin' => $superadmin]);
        $user->tenants()->attach($tenant);
        Tenant::find($tenant)->run(fn () => $user->assignRole($grupos));

        $token = $this->postJson("http://{$tenant}.localhost/api/login", [
            'cpf' => $user->cpf,
            'password' => 'senha',
        ])->assertOk()->json('token');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $token;
    }

    private function codigoHttp(string $token, string $tenant, string $metodo, string $caminho): int
    {
        $resposta = $this->withToken($token)->json($metodo, "http://{$tenant}.localhost/api/administracao/tabelas-comuns/{$caminho}");
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $resposta->status();
    }

    public function test_administrador_da_prefeitura_nao_acessa_nenhuma_rota(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar('demo', superadmin: false, grupos: [Acesso::ADMINISTRADOR]);

        foreach (self::ROTAS as [$metodo, $caminho]) {
            $this->assertSame(403, $this->codigoHttp($token, 'demo', $metodo, $caminho), "{$metodo} {$caminho}");
        }
    }

    public function test_superadmin_fora_da_administradora_nao_acessa(): void
    {
        $this->criarTenant('demo');
        $this->criarTenant('outra');
        $token = $this->entrar('outra', superadmin: true, grupos: [Acesso::ADMINISTRADOR]);

        foreach (self::ROTAS as [$metodo, $caminho]) {
            $this->assertSame(403, $this->codigoHttp($token, 'outra', $metodo, $caminho), "{$metodo} {$caminho}");
        }
    }

    public function test_superadmin_na_administradora_acessa_todas_as_rotas(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar('demo', superadmin: true);

        // Sem corpo, a inclusão e a alteração param na validação (422) ou no registro inexistente (404):
        // o que importa aqui é passar da autorização.
        foreach (self::ROTAS as [$metodo, $caminho]) {
            $this->assertContains($this->codigoHttp($token, 'demo', $metodo, $caminho), [200, 404, 422], "{$metodo} {$caminho}");
        }
    }

    public function test_telas_nao_podem_ser_dadas_a_grupos(): void
    {
        $this->criarTenant('demo');
        $token = $this->entrar('demo', superadmin: false, grupos: [Acesso::ADMINISTRADOR]);

        $resposta = $this->withToken($token)->postJson('http://demo.localhost/api/grupos', [
            'nome' => 'Tabelas centrais',
            'telas' => ['administracao.tabelas-comuns.cidades'],
        ]);

        $resposta->assertUnprocessable()->assertJsonValidationErrors(['telas.0' => 'Tela desconhecida.']);
    }
}
