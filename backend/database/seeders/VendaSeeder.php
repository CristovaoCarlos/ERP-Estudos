<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\Produto;
use App\Models\Venda;
use App\Models\Vendedor;
use App\Support\Vendas;
use Illuminate\Database\Seeder;

/**
 * 20 vendas de exemplo nos últimos 30 dias, com clientes, vendedores e produtos ativos já
 * cadastrados (rode antes ClienteSeeder, VendedorSeeder e ProdutoSeeder). Passam pelo mesmo
 * registro da tela: dão baixa no estoque e não vendem além do saldo. 2 delas ficam canceladas.
 * Rode por prefeitura: `php artisan tenants:seed --tenants=<id> --class="Database\Seeders\VendaSeeder"`.
 */
class VendaSeeder extends Seeder
{
    public function run(): void
    {
        $produtos = Produto::where('ativo', true)->get();
        $clientes = Cliente::where('ativo', true)->pluck('id_cliente');
        $vendedores = Vendedor::where('ativo', true)->pluck('id_vendedor');
        if ($produtos->isEmpty() || $clientes->isEmpty() || $vendedores->isEmpty()) {
            $this->command?->warn('A venda exige cliente, vendedor e produto ativos: rode antes ClienteSeeder, VendedorSeeder e ProdutoSeeder.');

            return;
        }

        for ($numero = 1; $numero <= 20; $numero++) {
            $itens = [];
            foreach ($produtos->random(min(fake()->numberBetween(1, 4), $produtos->count())) as $produto) {
                $produto->refresh();
                $quantidade = fake()->numberBetween(1, 5);
                if ($produto->controla_estoque && (float) $produto->estoque_atual < $quantidade) {
                    continue;
                }
                $itens[] = [
                    'produto' => $produto->id_produto,
                    'quantidade' => number_format($quantidade, 3, '.', ''),
                    'preco_unitario' => (string) $produto->preco_venda,
                    'desconto' => '0.00',
                ];
            }
            if (! $itens) {
                continue;
            }

            $venda = Vendas::registrar([
                'data' => now()->subDays(fake()->numberBetween(0, 30))->format('Y-m-d'),
                'cliente' => $clientes->random(),
                'vendedor' => $vendedores->random(),
                'forma_pagamento' => fake()->randomElement(array_keys(Venda::FORMAS_DE_PAGAMENTO)),
                'desconto' => '0.00',
                'observacoes' => null,
                'itens' => $itens,
            ]);
            if ($numero % 10 === 0) {
                Vendas::cancelar($venda);
            }
        }
    }
}
