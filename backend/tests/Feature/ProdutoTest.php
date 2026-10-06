<?php

namespace Tests\Feature;

use App\Models\Produto;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Gtin;
use Database\Seeders\ProdutoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProdutoTest extends TestCase
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
    private function entrar(array $permissoes = ['cadastros.produtos'], string $tenant = 'demo'): string
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

    /** Corpo válido, com os campos do teste por cima. */
    private function produto(array $campos = []): array
    {
        return array_replace_recursive([
            'codigo' => 'cafe-500',
            'descricao' => 'Café torrado 500 g',
            'codigo_barras' => '789 1000 31550-7',
            'unidade' => 'UN',
            'categoria' => 'Alimentos',
            'precos' => ['custo' => 12.5, 'venda' => 18.9],
            'estoque' => ['controla' => true, 'atual' => 40, 'minimo' => 10],
            'fiscal' => ['ncm' => '0901.21.00', 'cest' => '17.096.00', 'origem' => 0],
            'pesos' => ['bruto' => 0.52, 'liquido' => 0.5],
            'observacoes' => null,
            'ativo' => true,
        ], $campos);
    }

    public function test_exige_a_permissao_da_tela(): void
    {
        $this->criarTenant();
        $token = $this->entrar(['cadastros.clientes']);

        $this->emDemo($token, 'get', '/api/cadastros/produtos')->assertForbidden();
        $this->emDemo($token, 'post', '/api/cadastros/produtos', $this->produto())->assertForbidden();
        $this->emDemo($token, 'get', '/api/cadastros/produtos/opcoes')->assertForbidden();
    }

    public function test_cadastra_lista_altera_e_exclui(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $id = $this->emDemo($token, 'post', '/api/cadastros/produtos', $this->produto())
            ->assertCreated()
            ->assertJsonPath('codigo', 'CAFE-500')
            ->assertJsonPath('codigo_barras', '7891000315507')
            ->assertJsonPath('fiscal.ncm', '09012100')
            ->assertJsonPath('fiscal.cest', '1709600')
            ->assertJsonPath('precos.custo', '12.5000')
            ->assertJsonPath('precos.venda', '18.90')
            ->assertJsonPath('precos.margem', 51.2)
            ->assertJsonPath('estoque.atual', '0.000')
            ->assertJsonPath('estoque.abaixo_do_minimo', true)
            ->json('id');

        $this->emDemo($token, 'get', '/api/cadastros/produtos')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.descricao', 'Café torrado 500 g');

        $this->emDemo($token, 'put', "/api/cadastros/produtos/{$id}", $this->produto([
            'descricao' => 'Café torrado 1 kg',
            'estoque' => ['minimo' => 0],
        ]))
            ->assertOk()
            ->assertJsonPath('descricao', 'Café torrado 1 kg')
            ->assertJsonPath('estoque.minimo', '0.000');

        $this->emDemo($token, 'delete', "/api/cadastros/produtos/{$id}")->assertNoContent();
        Tenant::find('demo')->run(fn () => $this->assertSame(0, Produto::count()));
    }

    public function test_recusa_codigo_e_codigo_de_barras_repetidos(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $this->emDemo($token, 'post', '/api/cadastros/produtos', $this->produto())->assertCreated();

        $this->emDemo($token, 'post', '/api/cadastros/produtos', $this->produto())
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'codigo' => 'Já existe um produto com este código.',
                'codigo_barras' => 'Já existe um produto com este código de barras.',
            ]);
    }

    public function test_alterar_mantendo_o_proprio_codigo_nao_acusa_repeticao(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $id = $this->emDemo($token, 'post', '/api/cadastros/produtos', $this->produto())->json('id');

        $this->emDemo($token, 'put', "/api/cadastros/produtos/{$id}", $this->produto())->assertOk();
    }

    public function test_confere_o_digito_do_codigo_de_barras(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $mensagem = 'Código de barras inválido: confira os dígitos (EAN de 8, 12, 13 ou 14 números).';

        foreach (['7891000315508', '789ABC0315507', '12345'] as $codigo) {
            $this->emDemo($token, 'post', '/api/cadastros/produtos', $this->produto(['codigo_barras' => $codigo]))
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['codigo_barras' => $mensagem]);
        }
        $this->assertTrue(Gtin::valido('78910003'));
        $this->assertTrue(Gtin::valido(Gtin::gerar()));
    }

    public function test_estoque_atual_nao_muda_pelo_cadastro(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        // Na inclusão, nasce com 0, mesmo que venha um saldo.
        $id = $this->emDemo($token, 'post', '/api/cadastros/produtos', $this->produto())
            ->assertCreated()
            ->assertJsonPath('estoque.atual', '0.000')
            ->json('id');

        // Saldo vindo da entrada de notas: a alteração do cadastro não mexe nele.
        Tenant::find('demo')->run(fn () => Produto::whereKey($id)->update(['estoque_atual' => 37]));
        $this->emDemo($token, 'put', "/api/cadastros/produtos/{$id}", $this->produto(['estoque' => ['atual' => 999]]))
            ->assertOk()
            ->assertJsonPath('estoque.atual', '37.000');

        // Desligar o controle tira o mínimo, mas não apaga o saldo.
        $this->emDemo($token, 'put', "/api/cadastros/produtos/{$id}", $this->produto([
            'estoque' => ['controla' => false, 'minimo' => 10],
        ]))
            ->assertOk()
            ->assertJsonPath('estoque.controla', false)
            ->assertJsonPath('estoque.atual', '37.000')
            ->assertJsonPath('estoque.minimo', null)
            ->assertJsonPath('estoque.abaixo_do_minimo', false);
    }

    public function test_sem_custo_nao_ha_margem(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/cadastros/produtos', $this->produto(['precos' => ['custo' => null]]))
            ->assertCreated()
            ->assertJsonPath('precos.margem', null);
    }

    public function test_valida_os_demais_campos(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/cadastros/produtos', $this->produto([
            'codigo' => 'código com espaço',
            'descricao' => '',
            'unidade' => 'XX',
            'precos' => ['venda' => null, 'custo' => -1],
            'estoque' => ['minimo' => -2],
            'fiscal' => ['ncm' => '0901', 'cest' => '12', 'origem' => 9],
            'pesos' => ['bruto' => 1, 'liquido' => 2],
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'codigo' => 'Use só letras, números, ponto, barra e hífen.',
                'descricao' => 'Informe a descrição.',
                'unidade' => 'Escolha uma unidade da lista.',
                'precos.venda' => 'Informe o preço de venda.',
                'precos.custo' => 'O preço de custo não pode ser negativo.',
                'estoque.minimo' => 'O estoque mínimo não pode ser negativo.',
                'fiscal.ncm' => 'O NCM tem 8 dígitos.',
                'fiscal.cest' => 'O CEST tem 7 dígitos.',
                'fiscal.origem' => 'Escolha a origem da mercadoria.',
                'pesos.liquido' => 'O peso líquido não pode passar do bruto.',
            ]);
    }

    public function test_opcoes_trazem_unidades_origens_e_categorias_usadas(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $this->emDemo($token, 'post', '/api/cadastros/produtos', $this->produto());
        $this->emDemo($token, 'post', '/api/cadastros/produtos', $this->produto([
            'codigo' => 'det-1', 'codigo_barras' => null, 'categoria' => 'Limpeza',
        ]));

        $this->emDemo($token, 'get', '/api/cadastros/produtos/opcoes')
            ->assertOk()
            ->assertJsonFragment(['valor' => 'UN', 'descricao' => 'Unidade'])
            ->assertJsonCount(13, 'unidades')
            ->assertJsonPath('origens.0', ['valor' => 0, 'descricao' => 'Nacional'])
            ->assertJsonCount(9, 'origens')
            ->assertJsonPath('categorias', ['Alimentos', 'Limpeza']);
    }

    public function test_seeder_cria_25_produtos_validos(): void
    {
        $this->criarTenant();

        Tenant::find('demo')->run(function () {
            $this->seed(ProdutoSeeder::class);

            $this->assertSame(25, Produto::count());
            $this->assertSame(2, Produto::where('ativo', false)->count());
            $this->assertSame(2, Produto::where('controla_estoque', false)->count());
            $this->assertGreaterThanOrEqual(3, Produto::all()->filter->abaixoDoMinimo()->count());
            foreach (Produto::whereNotNull('codigo_barras')->pluck('codigo_barras') as $codigo) {
                $this->assertTrue(Gtin::valido($codigo), "GTIN inválido: {$codigo}");
            }
        });
    }
}
