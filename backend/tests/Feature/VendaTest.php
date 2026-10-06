<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\Produto;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Venda;
use App\Models\Vendedor;
use Database\Seeders\VendaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendaTest extends TestCase
{
    use RefreshDatabase;

    /** Cliente e vendedor das vendas do teste (criados na primeira venda). */
    private ?int $idCliente = null;

    private ?int $idVendedor = null;

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
    private function entrar(array $permissoes = ['lancamentos.vendas'], string $tenant = 'demo'): string
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

    /** Executa no banco da prefeitura `demo`. */
    private function naDemo(callable $acao): mixed
    {
        $resultado = Tenant::find('demo')->run($acao);
        tenancy()->end();

        return $resultado;
    }

    /** Produto ativo com estoque controlado, salvo os campos informados. */
    private function produto(array $campos = []): Produto
    {
        return $this->naDemo(fn () => Produto::factory()->create(array_replace([
            'controla_estoque' => true,
            'estoque_atual' => 10,
            'preco_venda' => 10.50,
            'unidade' => 'UN',
        ], $campos)));
    }

    private function estoque(Produto $produto): string
    {
        return $this->naDemo(fn () => $produto->refresh()->estoque_atual);
    }

    /** Corpo válido de venda com os itens informados. */
    private function venda(array $itens, array $campos = []): array
    {
        $this->idCliente ??= $this->naDemo(fn () => Cliente::factory()->create()->id_cliente);
        $this->idVendedor ??= $this->naDemo(fn () => Vendedor::factory()->create()->id_vendedor);

        return array_replace([
            'data' => now()->format('Y-m-d'),
            'cliente' => $this->idCliente,
            'vendedor' => $this->idVendedor,
            'forma_pagamento' => 'pix',
            'desconto' => 0,
            'observacoes' => null,
            'itens' => $itens,
        ], $campos);
    }

    public function test_exige_a_permissao_da_tela(): void
    {
        $this->criarTenant();
        $token = $this->entrar(['cadastros.produtos']);
        $produto = $this->produto();

        $this->emDemo($token, 'get', '/api/lancamentos/vendas')->assertForbidden();
        $this->emDemo($token, 'get', '/api/lancamentos/vendas/opcoes')->assertForbidden();
        $this->emDemo($token, 'post', '/api/lancamentos/vendas', $this->venda([
            ['produto' => $produto->id_produto, 'quantidade' => 1, 'preco_unitario' => 10.5],
        ]))->assertForbidden();
        $this->assertSame('10.000', $this->estoque($produto));
    }

    public function test_registra_a_venda_com_totais_e_baixa_no_estoque(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        [$cliente, $vendedor] = $this->naDemo(fn () => [Cliente::factory()->create(), Vendedor::factory()->create()]);
        $arroz = $this->produto(['descricao' => 'Arroz 5 kg', 'codigo' => 'ARZ-1']);
        $carne = $this->produto(['unidade' => 'KG', 'preco_venda' => 39.90, 'estoque_atual' => 3.5]);
        $servico = $this->produto(['controla_estoque' => false, 'estoque_atual' => 0, 'preco_venda' => 25]);

        $resposta = $this->emDemo($token, 'post', '/api/lancamentos/vendas', $this->venda([
            ['produto' => $arroz->id_produto, 'quantidade' => 2, 'preco_unitario' => 10.5, 'desconto' => 1],
            ['produto' => $carne->id_produto, 'quantidade' => 1.255, 'preco_unitario' => 39.9],
            ['produto' => $servico->id_produto, 'quantidade' => 3, 'preco_unitario' => 25],
        ], [
            'cliente' => $cliente->id_cliente,
            'vendedor' => $vendedor->id_vendedor,
            'forma_pagamento' => 'dinheiro',
            'desconto' => 0.5,
        ]))->assertCreated();

        // 2 × 10,50 − 1,00 = 20,00; 1,255 × 39,90 = 50,0745 → 50,07; 3 × 25,00 = 75,00.
        $resposta
            ->assertJsonPath('cliente.id', $cliente->id_cliente)
            ->assertJsonPath('vendedor.nome', $vendedor->nome)
            ->assertJsonPath('situacao', 'finalizada')
            ->assertJsonPath('subtotal', '145.07')
            ->assertJsonPath('desconto', '0.50')
            ->assertJsonPath('total', '144.57')
            ->assertJsonCount(3, 'itens')
            ->assertJsonPath('itens.0.codigo', 'ARZ-1')
            ->assertJsonPath('itens.0.descricao', 'Arroz 5 kg')
            ->assertJsonPath('itens.0.total', '20.00')
            ->assertJsonPath('itens.1.quantidade', '1.255')
            ->assertJsonPath('itens.1.total', '50.07')
            ->assertJsonPath('itens.2.baixou_estoque', false);

        $this->assertSame('8.000', $this->estoque($arroz));
        $this->assertSame('2.245', $this->estoque($carne));
        // Sem controle de estoque: o saldo não muda.
        $this->assertSame('0.000', $this->estoque($servico));
    }

    public function test_nao_vende_produto_sem_estoque_nem_acima_do_saldo(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $semSaldo = $this->produto(['descricao' => 'Feijão 1 kg', 'estoque_atual' => 0]);
        $pouco = $this->produto(['descricao' => 'Café 500 g', 'estoque_atual' => 3]);

        $this->emDemo($token, 'post', '/api/lancamentos/vendas', $this->venda([
            ['produto' => $semSaldo->id_produto, 'quantidade' => 1, 'preco_unitario' => 10],
            ['produto' => $pouco->id_produto, 'quantidade' => 4, 'preco_unitario' => 10],
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'itens.0.quantidade' => 'Feijão 1 kg está sem estoque.',
                'itens.1.quantidade' => 'Estoque insuficiente: há 3 UN de Café 500 g.',
            ]);

        // O mesmo produto em dois itens soma o pedido: 2 + 2 passa dos 3.
        $this->emDemo($token, 'post', '/api/lancamentos/vendas', $this->venda([
            ['produto' => $pouco->id_produto, 'quantidade' => 2, 'preco_unitario' => 10],
            ['produto' => $pouco->id_produto, 'quantidade' => 2, 'preco_unitario' => 10],
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['itens.0.quantidade', 'itens.1.quantidade']);

        // Nada foi gravado.
        $this->assertSame('3.000', $this->estoque($pouco));
        $this->assertSame(0, $this->naDemo(fn () => Venda::count()));

        // Exatamente o saldo pode.
        $this->emDemo($token, 'post', '/api/lancamentos/vendas', $this->venda([
            ['produto' => $pouco->id_produto, 'quantidade' => 3, 'preco_unitario' => 10],
        ]))->assertCreated();
        $this->assertSame('0.000', $this->estoque($pouco));
    }

    public function test_cancela_e_devolve_ao_estoque(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $produto = $this->produto(['estoque_atual' => 5]);
        $servico = $this->produto(['controla_estoque' => false, 'estoque_atual' => 0]);

        $id = $this->emDemo($token, 'post', '/api/lancamentos/vendas', $this->venda([
            ['produto' => $produto->id_produto, 'quantidade' => 2, 'preco_unitario' => 10],
            ['produto' => $servico->id_produto, 'quantidade' => 1, 'preco_unitario' => 50],
        ]))->json('id');
        $this->assertSame('3.000', $this->estoque($produto));

        $this->emDemo($token, 'post', "/api/lancamentos/vendas/{$id}/cancelar")
            ->assertOk()
            ->assertJsonPath('situacao', 'cancelada')
            ->assertJsonPath('total', '70.00');
        $this->assertSame('5.000', $this->estoque($produto));
        $this->assertSame('0.000', $this->estoque($servico));

        // Cancelar de novo não devolve outra vez.
        $this->emDemo($token, 'post', "/api/lancamentos/vendas/{$id}/cancelar")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['venda' => 'Esta venda já está cancelada.']);
        $this->assertSame('5.000', $this->estoque($produto));
    }

    public function test_valida_a_venda(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/lancamentos/vendas', $this->venda([], [
            'data' => now()->addDay()->format('Y-m-d'),
            'cliente' => null,
            'vendedor' => null,
            'forma_pagamento' => 'cheque',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'data' => 'A data da venda não pode ser futura.',
                'cliente' => 'Escolha o cliente.',
                'vendedor' => 'Escolha o vendedor.',
                'forma_pagamento' => 'Escolha a forma de pagamento.',
                'itens' => 'Inclua ao menos um produto.',
            ]);

        [$cliente, $vendedor] = $this->naDemo(fn () => [
            Cliente::factory()->inativo()->create(), Vendedor::factory()->inativo()->create(),
        ]);
        $inativo = $this->produto(['ativo' => false]);
        $produto = $this->produto();

        $this->emDemo($token, 'post', '/api/lancamentos/vendas', $this->venda([
            ['produto' => $inativo->id_produto, 'quantidade' => 1, 'preco_unitario' => 10],
            ['produto' => $produto->id_produto, 'quantidade' => 0, 'preco_unitario' => -1],
            ['produto' => $produto->id_produto, 'quantidade' => 1.2345, 'preco_unitario' => 10],
        ], ['cliente' => $cliente->id_cliente, 'vendedor' => $vendedor->id_vendedor]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'cliente' => 'Escolha um cliente ativo.',
                'vendedor' => 'Escolha um vendedor ativo.',
                'itens.0.produto' => 'Produto inativo ou excluído: tire-o da venda.',
                'itens.1.quantidade' => 'A quantidade tem que ser maior que zero.',
                'itens.1.preco_unitario' => 'O preço não pode ser negativo.',
                'itens.2.quantidade' => 'Use até 3 casas decimais.',
            ]);

        // Descontos: o do item até o valor do item; o da venda até o subtotal.
        $this->emDemo($token, 'post', '/api/lancamentos/vendas', $this->venda([
            ['produto' => $produto->id_produto, 'quantidade' => 1, 'preco_unitario' => 10, 'desconto' => 10.01],
        ]))->assertJsonValidationErrors(['itens.0.desconto' => 'O desconto não pode passar do valor do item.']);
        $this->emDemo($token, 'post', '/api/lancamentos/vendas', $this->venda([
            ['produto' => $produto->id_produto, 'quantidade' => 2, 'preco_unitario' => 10, 'desconto' => 5],
        ], ['desconto' => 15.01]))->assertJsonValidationErrors(['desconto' => 'O desconto não pode passar do subtotal.']);

        $this->assertSame('10.000', $this->estoque($produto));
    }

    public function test_lista_as_vendas_da_mais_recente_para_a_mais_antiga(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $produto = $this->produto();
        foreach (['2026-01-10', '2026-03-05', '2026-02-20'] as $data) {
            $this->emDemo($token, 'post', '/api/lancamentos/vendas', $this->venda([
                ['produto' => $produto->id_produto, 'quantidade' => 1, 'preco_unitario' => 10.5],
            ], ['data' => $data]))->assertCreated();
        }

        $this->emDemo($token, 'get', '/api/lancamentos/vendas')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.data', '2026-03-05')
            ->assertJsonPath('data.1.data', '2026-02-20')
            ->assertJsonPath('data.0.cliente.id', $this->idCliente)
            ->assertJsonPath('data.0.vendedor.id', $this->idVendedor)
            ->assertJsonPath('data.0.itens.0.preco_unitario', '10.50');
    }

    public function test_opcoes_trazem_so_os_ativos_com_o_saldo(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $this->naDemo(function () {
            Cliente::factory()->create(['nome' => 'Ana Ativa']);
            Cliente::factory()->inativo()->create();
            Vendedor::factory()->create(['nome' => 'Vera Vendedora']);
            Vendedor::factory()->inativo()->create();
        });
        $produto = $this->produto(['descricao' => 'Arroz 5 kg', 'estoque_atual' => 7]);
        $this->produto(['ativo' => false]);

        $this->emDemo($token, 'get', '/api/lancamentos/vendas/opcoes')
            ->assertOk()
            ->assertJsonCount(6, 'formas_de_pagamento')
            ->assertJsonPath('formas_de_pagamento.0', ['valor' => 'dinheiro', 'descricao' => 'Dinheiro'])
            ->assertJsonCount(1, 'clientes')
            ->assertJsonPath('clientes.0.nome', 'Ana Ativa')
            ->assertJsonCount(1, 'vendedores')
            ->assertJsonPath('vendedores.0.nome', 'Vera Vendedora')
            ->assertJsonCount(1, 'produtos')
            ->assertJsonPath('produtos.0.id', $produto->id_produto)
            ->assertJsonPath('produtos.0.estoque_atual', '7.000')
            ->assertJsonPath('produtos.0.controla_estoque', true);
    }

    public function test_nao_exclui_produto_cliente_nem_vendedor_com_venda(): void
    {
        $this->criarTenant();
        $token = $this->entrar(['lancamentos.vendas', 'cadastros.produtos', 'cadastros.clientes', 'cadastros.vendedores']);
        [$cliente, $vendedor] = $this->naDemo(fn () => [Cliente::factory()->create(), Vendedor::factory()->create()]);
        $produto = $this->produto();
        $this->emDemo($token, 'post', '/api/lancamentos/vendas', $this->venda([
            ['produto' => $produto->id_produto, 'quantidade' => 1, 'preco_unitario' => 10],
        ], ['cliente' => $cliente->id_cliente, 'vendedor' => $vendedor->id_vendedor]))->assertCreated();

        $this->emDemo($token, 'delete', "/api/cadastros/produtos/{$produto->id_produto}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('produto');
        $this->emDemo($token, 'delete', "/api/cadastros/clientes/{$cliente->id_cliente}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cliente');
        $this->emDemo($token, 'delete', "/api/cadastros/vendedores/{$vendedor->id_vendedor}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('vendedor');
    }

    public function test_seeder_registra_vendas_sem_estoque_negativo(): void
    {
        $this->criarTenant();

        $this->naDemo(function () {
            Cliente::factory()->count(3)->create();
            Vendedor::factory()->count(2)->create();
            Produto::factory()->count(5)->create();
            Produto::factory()->estoqueBaixo()->count(2)->create();
            Produto::factory()->semEstoque()->create();

            $this->seed(VendaSeeder::class);

            $this->assertGreaterThan(0, Venda::count());
            $this->assertSame(0, Produto::where('estoque_atual', '<', 0)->count());
            foreach (Venda::with('itens')->get() as $venda) {
                $this->assertSame($venda->total, number_format($venda->itens->sum('total') - $venda->desconto, 2, '.', ''));
            }
        });
    }
}
