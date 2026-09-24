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

        $this->emLemarq($token, '/api/tabelas-comuns/cnae')->assertForbidden();
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
        $token = $this->entrar(['tabelas-comuns.cnae']);

        $this->emLemarq($token, '/api/tabelas-comuns/cnae')
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
}
