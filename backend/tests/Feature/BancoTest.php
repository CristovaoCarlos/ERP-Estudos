<?php

namespace Tests\Feature;

use App\Models\Banco;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BancoTest extends TestCase
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
        $token = $this->entrar(['tabelas-comuns.cidades']);

        $this->emLemarq($token, '/api/tabelas-comuns/bancos')->assertForbidden();
    }

    public function test_lista_os_bancos_do_banco_central_por_nome(): void
    {
        $this->criarTenant();
        Banco::insert([
            ['codigo' => '0341', 'descricao' => 'Itaú Unibanco S.A.'],
            ['codigo' => '0001', 'descricao' => 'Banco do Brasil S.A.'],
        ]);
        $token = $this->entrar(['tabelas-comuns.bancos']);

        $this->emLemarq($token, '/api/tabelas-comuns/bancos')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.codigo', '0001')
            ->assertJsonPath('data.0.nome', 'Banco do Brasil S.A.')
            ->assertJsonPath('data.1.nome', 'Itaú Unibanco S.A.');
    }
}
