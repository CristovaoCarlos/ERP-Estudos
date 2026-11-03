<?php

namespace Tests\Feature;

use App\Http\Controllers\ClienteController;
use App\Http\Controllers\ProdutoController;
use App\Http\Controllers\VendaController;
use App\Http\Controllers\VendedorController;
use App\Models\Cliente;
use App\Models\Produto;
use App\Models\Tenant;
use App\Models\Venda;
use App\Models\Vendedor;
use App\Support\CacheDeListagens;
use App\Support\Vendas;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Cache das listagens. Tudo roda dentro de um só `Tenant::run`: em teste o cache é `array`, e cada
 * requisição HTTP inicia a prefeitura com um gerenciador de cache novo (vazio). No Redis os dados
 * ficam no servidor e valem entre requisições.
 */
class CacheDeListagensTest extends TestCase
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

    private function naDemo(callable $acao): void
    {
        $tenant = Tenant::create(['id' => 'demo', 'nome' => 'Prefeitura demo']);
        $tenant->domains()->create(['domain' => 'demo.localhost']);
        $tenant->run($acao);
        tenancy()->end();
    }

    /** Linhas que o `index` do controller devolve. */
    private function listar(string $controller): array
    {
        return app($controller)->index()->getData(true)['data'];
    }

    private function vender(Produto $produto): Venda
    {
        return Vendas::registrar([
            'data' => now()->format('Y-m-d'),
            'cliente' => Cliente::factory()->create()->id_cliente,
            'vendedor' => Vendedor::factory()->create()->id_vendedor,
            'forma_pagamento' => 'pix',
            'desconto' => '0.00',
            'observacoes' => 'Primeira',
            'itens' => [
                ['produto' => $produto->id_produto, 'quantidade' => '2.000', 'preco_unitario' => '10.00', 'desconto' => '0.00'],
            ],
        ]);
    }

    public function test_listagens_ficam_no_cache_por_5_minutos(): void
    {
        $this->naDemo(function () {
            $produto = Produto::factory()->create(['descricao' => 'Primeira', 'controla_estoque' => false]);
            Cliente::factory()->create(['nome' => 'Primeira']);
            Vendedor::factory()->create(['nome' => 'Primeira']);
            $this->vender($produto);

            // [controller, tabela, coluna alterada, campo da API]
            $listagens = [
                [VendaController::class, 'tb_venda', 'observacoes', 'observacoes'],
                [ClienteController::class, 'tb_cliente', 'nome', 'nome'],
                [ProdutoController::class, 'tb_produto', 'descricao', 'descricao'],
                [VendedorController::class, 'tb_vendedor', 'nome', 'nome'],
            ];
            foreach ($listagens as [$controller, $tabela, $coluna, $campo]) {
                $this->assertContains('Primeira', array_column($this->listar($controller), $campo), $controller);
                // Alteração direta no banco, sem os eventos dos models: o cache não fica sabendo.
                DB::connection('tenant')->table($tabela)->update([$coluna => 'Segunda']);
            }

            $this->travel(CacheDeListagens::VALIDADE - 1)->seconds();
            foreach ($listagens as [$controller, , , $campo]) {
                $this->assertNotContains('Segunda', array_column($this->listar($controller), $campo), $controller);
            }

            $this->travel(2)->seconds();
            foreach ($listagens as [$controller, , , $campo]) {
                $this->assertContains('Segunda', array_column($this->listar($controller), $campo), $controller);
            }
        });
    }

    public function test_alterar_os_cadastros_tira_as_listagens_do_cache(): void
    {
        $this->naDemo(function () {
            $guardarTudo = function () {
                foreach ([VendaController::class, ClienteController::class, ProdutoController::class, VendedorController::class] as $controller) {
                    $this->listar($controller);
                }
            };
            $noCache = fn (string $listagem) => Cache::has(CacheDeListagens::chave($listagem));

            $guardarTudo();
            $cliente = Cliente::factory()->create();
            $this->assertFalse($noCache(CacheDeListagens::CLIENTES));
            $this->assertFalse($noCache(CacheDeListagens::VENDAS));
            $this->assertTrue($noCache(CacheDeListagens::PRODUTOS));
            $this->assertTrue($noCache(CacheDeListagens::VENDEDORES));

            $guardarTudo();
            $vendedor = Vendedor::factory()->create();
            $this->assertFalse($noCache(CacheDeListagens::VENDEDORES));
            $this->assertFalse($noCache(CacheDeListagens::VENDAS));
            $this->assertTrue($noCache(CacheDeListagens::CLIENTES));

            $guardarTudo();
            $produto = Produto::factory()->create();
            $this->assertFalse($noCache(CacheDeListagens::PRODUTOS));
            $this->assertTrue($noCache(CacheDeListagens::VENDAS));

            $guardarTudo();
            $cliente->update(['nome' => 'Outro nome']);
            $this->assertFalse($noCache(CacheDeListagens::CLIENTES));
            $this->assertFalse($noCache(CacheDeListagens::VENDAS));

            $guardarTudo();
            $vendedor->delete();
            $produto->delete();
            $this->assertFalse($noCache(CacheDeListagens::VENDEDORES));
            $this->assertFalse($noCache(CacheDeListagens::PRODUTOS));
        });
    }

    public function test_registrar_e_cancelar_venda_tiram_vendas_e_produtos_do_cache(): void
    {
        $this->naDemo(function () {
            $produto = Produto::factory()->create(['controla_estoque' => true, 'estoque_atual' => 10]);
            $this->listar(ProdutoController::class);
            $this->listar(VendaController::class);

            $venda = $this->vender($produto);
            $this->assertSame([$venda->id_venda], array_column($this->listar(VendaController::class), 'id'));
            $this->assertSame('8.000', $this->listar(ProdutoController::class)[0]['estoque']['atual']);

            Vendas::cancelar($venda);
            $this->assertSame('cancelada', $this->listar(VendaController::class)[0]['situacao']);
            $this->assertSame('10.000', $this->listar(ProdutoController::class)[0]['estoque']['atual']);
        });
    }
}
