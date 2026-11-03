<?php

namespace App\Support;

use App\Http\Resources\VendaResource;
use App\Models\Produto;
use App\Models\Venda;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Registro e cancelamento de vendas, com o estoque. Tudo numa transação, com os produtos travados
 * (`lockForUpdate`): duas vendas ao mesmo tempo não vendem o mesmo saldo. Os valores são calculados
 * com bcmath (texto com casas fixas), sem os erros de arredondamento do float.
 */
class Vendas
{
    /**
     * Listagem de Lançamentos › Vendas no formato da API, do cache por até 5 minutos.
     *
     * @return list<array<string, mixed>>
     */
    public static function listagem(): array
    {
        return CacheDeListagens::lembrar(CacheDeListagens::VENDAS, fn () => VendaResource::collection(
            Venda::with(['cliente', 'vendedor', 'itens'])
                ->orderByDesc('data_venda')
                ->orderByDesc('id_venda')
                ->get(),
        )->resolve());
    }

    /**
     * Registra a venda e dá baixa no estoque dos produtos que o controlam. Pedido acima do saldo é
     * recusado com erro na quantidade do item (`itens.N.quantidade`). Produtos sem controle de
     * estoque (serviços, itens sob encomenda) vendem sem limite.
     *
     * @param  array{data: string, cliente: int, vendedor: int, forma_pagamento: string, desconto: string, observacoes: ?string, itens: list<array{produto: int, quantidade: string, preco_unitario: string, desconto: string}>}  $dados
     */
    public static function registrar(array $dados): Venda
    {
        $venda = DB::transaction(function () use ($dados) {
            $itens = $dados['itens'];
            $produtos = Produto::whereKey(array_unique(array_column($itens, 'produto')))
                ->lockForUpdate()
                ->get()
                ->keyBy('id_produto');

            self::conferirEstoque($itens, $produtos->all());

            $linhas = [];
            $subtotal = '0.00';
            foreach ($itens as $item) {
                $produto = $produtos[$item['produto']];
                $total = bcsub(self::valorBruto($item['quantidade'], $item['preco_unitario']), $item['desconto'], 2);
                $subtotal = bcadd($subtotal, $total, 2);
                $linhas[] = [
                    'id_produto' => $produto->id_produto,
                    'codigo' => $produto->codigo,
                    'descricao' => $produto->descricao,
                    'unidade' => $produto->unidade,
                    'quantidade' => $item['quantidade'],
                    'preco_unitario' => $item['preco_unitario'],
                    'desconto' => $item['desconto'],
                    'total' => $total,
                    'baixou_estoque' => $produto->controla_estoque,
                ];
            }

            $venda = Venda::create([
                'data_venda' => $dados['data'],
                'id_cliente' => $dados['cliente'],
                'id_vendedor' => $dados['vendedor'],
                'forma_pagamento' => $dados['forma_pagamento'],
                'subtotal' => $subtotal,
                'desconto' => $dados['desconto'],
                'total' => bcsub($subtotal, $dados['desconto'], 2),
                'observacoes' => $dados['observacoes'],
                'situacao' => Venda::FINALIZADA,
            ]);
            $venda->itens()->createMany($linhas);

            foreach ($linhas as $linha) {
                if ($linha['baixou_estoque']) {
                    Produto::whereKey($linha['id_produto'])->decrement('estoque_atual', $linha['quantidade']);
                }
            }

            return $venda;
        });
        // Depois do commit: antes dele, outra consulta guardaria de novo a lista antiga. O estoque
        // muda por increment/decrement, que não disparam os eventos do Produto.
        CacheDeListagens::esquecer(CacheDeListagens::VENDAS, CacheDeListagens::PRODUTOS);

        return $venda;
    }

    /** Cancela a venda e devolve ao estoque os itens que saíram dele. */
    public static function cancelar(Venda $venda): Venda
    {
        $venda = DB::transaction(function () use ($venda) {
            $venda = Venda::whereKey($venda->id_venda)->lockForUpdate()->firstOrFail();
            if ($venda->cancelada()) {
                throw ValidationException::withMessages(['venda' => 'Esta venda já está cancelada.']);
            }

            foreach ($venda->itens as $item) {
                if ($item->baixou_estoque) {
                    Produto::whereKey($item->id_produto)->increment('estoque_atual', $item->quantidade);
                }
            }
            $venda->update(['situacao' => Venda::CANCELADA, 'cancelada_em' => now()]);

            return $venda;
        });
        // Depois do commit: antes dele, outra consulta guardaria de novo a lista antiga. O estoque
        // muda por increment/decrement, que não disparam os eventos do Produto.
        CacheDeListagens::esquecer(CacheDeListagens::VENDAS, CacheDeListagens::PRODUTOS);

        return $venda;
    }

    /** Quantidade × preço, arredondado em 2 casas (meio centavo para cima). */
    public static function valorBruto(string $quantidade, string $preco): string
    {
        return bcadd(bcmul($quantidade, $preco, 5), '0.005', 2);
    }

    /** "12.500" → "12,5"; "3.000" → "3". */
    public static function formatarQuantidade(string $quantidade): string
    {
        return rtrim(rtrim(number_format((float) $quantidade, 3, ',', '.'), '0'), ',');
    }

    /**
     * Soma o pedido de cada produto (o mesmo produto pode vir em mais de um item) e recusa o que
     * passa do saldo.
     *
     * @param  list<array{produto: int, quantidade: string}>  $itens
     * @param  array<int, Produto>  $produtos
     */
    private static function conferirEstoque(array $itens, array $produtos): void
    {
        $pedido = [];
        foreach ($itens as $item) {
            $pedido[$item['produto']] = bcadd($pedido[$item['produto']] ?? '0', $item['quantidade'], 3);
        }

        $erros = [];
        foreach ($itens as $indice => $item) {
            $produto = $produtos[$item['produto']];
            $saldo = (string) $produto->estoque_atual;
            if (! $produto->controla_estoque || bccomp($pedido[$item['produto']], $saldo, 3) <= 0) {
                continue;
            }
            $erros["itens.{$indice}.quantidade"] = bccomp($saldo, '0', 3) <= 0
                ? "{$produto->descricao} está sem estoque."
                : 'Estoque insuficiente: há '.self::formatarQuantidade($saldo)." {$produto->unidade} de {$produto->descricao}.";
        }

        if ($erros) {
            throw ValidationException::withMessages($erros);
        }
    }
}
