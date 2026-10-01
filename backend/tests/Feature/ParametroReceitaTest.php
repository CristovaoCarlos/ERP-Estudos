<?php

namespace Tests\Feature;

use App\Models\ParametroReceita;
use App\Models\Receita;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ParametroReceitaTest extends TestCase
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

    /** Token de um usuário com as permissões de tela informadas. */
    private function entrar(array $permissoes, string $tenant = 'demo'): string
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

    private function emDemo(string $token, string $metodo, string $url, array $dados = [])
    {
        $resposta = $this->withToken($token)->json($metodo, "http://demo.localhost{$url}", $dados);
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $resposta;
    }

    /**
     * Duas receitas no banco da prefeitura.
     *
     * @return array{iss: int, iptu: int}
     */
    private function criarReceitas(): array
    {
        return Tenant::find('demo')->run(function () {
            $receita = fn (string $descricao) => Receita::create([
                'descricao' => $descricao,
                'possui_teto' => 'N',
            ])->id_receita;

            return ['iss' => $receita('ISS'), 'iptu' => $receita('IPTU')];
        });
    }

    public function test_exige_a_permissao_da_tela(): void
    {
        $this->criarTenant();
        $token = $this->entrar(['parametros.alvara']);

        $this->emDemo($token, 'get', '/api/parametros/receitas')->assertForbidden();
        $this->emDemo($token, 'put', '/api/parametros/receitas')->assertForbidden();
    }

    public function test_banco_da_prefeitura_nao_tem_mais_empresa(): void
    {
        $this->criarTenant();

        Tenant::find('demo')->run(function () {
            $this->assertFalse(Schema::hasTable('tb_empresa'));
            foreach (['tb_parametro_receita', 'tb_receita', 'tb_contribuinte', 'tb_imovel', 'tb_processing'] as $tabela) {
                $this->assertFalse(Schema::hasColumn($tabela, 'id_empresa'), $tabela);
            }
        });
    }

    public function test_opcoes_trazem_as_receitas(): void
    {
        $this->criarTenant();
        $this->criarReceitas();
        $token = $this->entrar(['parametros.receitas']);

        $this->emDemo($token, 'get', '/api/parametros/receitas/opcoes')
            ->assertOk()
            ->assertJsonCount(2, 'receitas')
            ->assertJsonPath('receitas.0.descricao', 'IPTU');
    }

    public function test_sem_registro_devolve_tudo_vazio(): void
    {
        $this->criarTenant();
        $token = $this->entrar(['parametros.receitas']);

        $this->emDemo($token, 'get', '/api/parametros/receitas')
            ->assertOk()
            ->assertJsonCount(13, 'receitas')
            ->assertJsonPath('receitas.iss', null);
    }

    public function test_grava_sempre_o_mesmo_registro(): void
    {
        $this->criarTenant();
        $ids = $this->criarReceitas();
        $token = $this->entrar(['parametros.receitas']);

        $this->emDemo($token, 'put', '/api/parametros/receitas', ['receitas' => ['iss' => $ids['iss']]])
            ->assertOk()
            ->assertJsonPath('receitas.iss', $ids['iss'])
            ->assertJsonPath('receitas.iptu', null);

        $this->emDemo($token, 'put', '/api/parametros/receitas', ['receitas' => ['iptu' => $ids['iptu']]])
            ->assertOk()
            ->assertJsonPath('receitas.iss', null)
            ->assertJsonPath('receitas.iptu', $ids['iptu']);

        $this->emDemo($token, 'get', '/api/parametros/receitas')->assertJsonPath('receitas.iptu', $ids['iptu']);
        Tenant::find('demo')->run(fn () => $this->assertSame(1, ParametroReceita::count()));
    }

    public function test_recusa_receita_inexistente(): void
    {
        $this->criarTenant();
        $token = $this->entrar(['parametros.receitas']);

        $this->emDemo($token, 'put', '/api/parametros/receitas', ['receitas' => ['iss' => 999]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['receitas.iss' => 'Receita não encontrada.']);
    }
}
