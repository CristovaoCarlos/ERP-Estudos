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

    private function emLemarq(string $token, string $url)
    {
        $resposta = $this->withToken($token)->getJson("http://lemarq.localhost{$url}");
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $resposta;
    }

    public function test_exige_a_permissao_da_tela(): void
    {
        $this->criarTenant();
        $token = $this->entrar(['tabelas-comuns.bancos']);

        $this->emLemarq($token, '/api/tabelas-comuns/cidades')->assertForbidden();
    }

    public function test_lista_as_cidades_do_banco_central_por_uf_e_nome(): void
    {
        $this->criarTenant();
        Cidade::insert([
            ['id_cidade' => 1, 'codigo' => '3550308', 'descricao' => 'São Paulo', 'uf' => 'SP'],
            ['id_cidade' => 2, 'codigo' => '1100015', 'descricao' => "Alta Floresta D'Oeste", 'uf' => 'RO'],
            ['id_cidade' => 3, 'codigo' => '3509502', 'descricao' => 'Campinas', 'uf' => 'SP'],
        ]);
        $token = $this->entrar(['tabelas-comuns.cidades']);

        $this->emLemarq($token, '/api/tabelas-comuns/cidades')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0', ['id' => 2, 'codigo_ibge' => '1100015', 'nome' => "Alta Floresta D'Oeste", 'uf' => 'RO'])
            ->assertJsonPath('data.1.nome', 'Campinas')
            ->assertJsonPath('data.2.nome', 'São Paulo');
    }
}
