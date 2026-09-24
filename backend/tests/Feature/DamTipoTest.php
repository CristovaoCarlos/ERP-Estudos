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
        $token = $this->entrar(['tabelas-comuns.selic']);

        $this->emLemarq($token, '/api/tabelas-comuns/tipos-de-dam')->assertForbidden();
    }

    public function test_lista_ordenada_pelo_codigo(): void
    {
        $this->criarTenant();
        DamTipo::insert([
            ['cod_dam_tipo' => 3, 'descricao' => 'IPTU'],
            ['cod_dam_tipo' => 1, 'descricao' => 'NOTA FISCAL'],
            ['cod_dam_tipo' => 2, 'descricao' => 'ALVARÁ'],
        ]);
        $token = $this->entrar(['tabelas-comuns.tipos-de-dam']);

        $this->emLemarq($token, '/api/tabelas-comuns/tipos-de-dam')
            ->assertOk()
            ->assertJsonPath('data.*.codigo', [1, 2, 3])
            ->assertJsonPath('data.0', ['codigo' => 1, 'descricao' => 'NOTA FISCAL']);
    }
}
