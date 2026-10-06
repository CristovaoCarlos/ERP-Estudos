<?php

namespace App\Relatorios;

use App\Models\Cliente;
use App\Models\Venda;
use App\Models\Vendedor;
use Illuminate\Database\Eloquent\Builder;

/**
 * Relatórios › Vendas no período. Monta os dados uma vez, para a prévia na tela (JSON) e para o
 * PDF: as vendas do período, o resumo das finalizadas e os totais por forma de pagamento e por
 * vendedor (com a comissão estimada). Canceladas ficam fora dos totais; na lista, só se pedidas.
 */
final class VendasNoPeriodo
{
    /**
     * @param  array{inicio: string, fim: string, vendedor: ?int, cliente: ?int, forma_pagamento: ?string, incluir_canceladas: bool}  $filtros
     */
    public function __construct(private readonly array $filtros) {}

    /** @return array<string, mixed> */
    public function dados(): array
    {
        $finalizadas = fn () => $this->doPeriodo()->where('situacao', Venda::FINALIZADA);

        $resumo = $finalizadas()
            ->selectRaw('count(*) as quantidade, sum(subtotal) as subtotal, sum(desconto) as descontos, sum(total) as total')
            ->toBase()
            ->first();
        $canceladas = $this->doPeriodo()->where('situacao', Venda::CANCELADA)
            ->selectRaw('count(*) as quantidade, sum(total) as total')
            ->toBase()
            ->first();
        $quantidade = (int) $resumo->quantidade;

        return [
            'filtros' => [
                'inicio' => $this->filtros['inicio'],
                'fim' => $this->filtros['fim'],
                'vendedor' => $this->filtros['vendedor']
                    ? ['id' => $this->filtros['vendedor'], 'nome' => Vendedor::whereKey($this->filtros['vendedor'])->value('nome')]
                    : null,
                'cliente' => $this->filtros['cliente']
                    ? ['id' => $this->filtros['cliente'], 'nome' => Cliente::whereKey($this->filtros['cliente'])->value('nome')]
                    : null,
                'forma_pagamento' => $this->filtros['forma_pagamento'],
                'incluir_canceladas' => $this->filtros['incluir_canceladas'],
            ],
            'resumo' => [
                'quantidade' => $quantidade,
                'subtotal' => self::valor($resumo->subtotal),
                'descontos' => self::valor($resumo->descontos),
                'total' => self::valor($resumo->total),
                'ticket_medio' => self::valor($quantidade ? (float) $resumo->total / $quantidade : 0),
                'canceladas' => [
                    'quantidade' => (int) $canceladas->quantidade,
                    'total' => self::valor($canceladas->total),
                ],
            ],
            'por_pagamento' => $finalizadas()
                ->selectRaw('forma_pagamento, count(*) as quantidade, sum(total) as total')
                ->groupBy('forma_pagamento')
                ->orderByRaw('sum(total) desc')
                ->toBase()
                ->get()
                ->map(fn (object $linha) => [
                    'forma_pagamento' => $linha->forma_pagamento,
                    'descricao' => Venda::FORMAS_DE_PAGAMENTO[$linha->forma_pagamento] ?? $linha->forma_pagamento,
                    'quantidade' => (int) $linha->quantidade,
                    'total' => self::valor($linha->total),
                ])
                ->all(),
            'por_vendedor' => $finalizadas()
                ->join('tb_vendedor', 'tb_vendedor.id_vendedor', '=', 'tb_venda.id_vendedor')
                ->selectRaw('tb_vendedor.id_vendedor, tb_vendedor.nome, tb_vendedor.comissao_percentual, count(*) as quantidade, sum(tb_venda.total) as total')
                ->groupBy('tb_vendedor.id_vendedor', 'tb_vendedor.nome', 'tb_vendedor.comissao_percentual')
                ->orderByRaw('sum(tb_venda.total) desc')
                ->toBase()
                ->get()
                ->map(fn (object $linha) => [
                    'id' => (int) $linha->id_vendedor,
                    'nome' => $linha->nome,
                    'quantidade' => (int) $linha->quantidade,
                    'total' => self::valor($linha->total),
                    'comissao_percentual' => self::valor($linha->comissao_percentual),
                    // Estimativa: a comissão de verdade pode ter regras próprias.
                    'comissao' => self::valor((float) $linha->total * (float) $linha->comissao_percentual / 100),
                ])
                ->all(),
            'vendas' => $this->doPeriodo()
                ->when(! $this->filtros['incluir_canceladas'], fn (Builder $consulta) => $consulta->where('situacao', Venda::FINALIZADA))
                ->with(['cliente', 'vendedor'])
                ->withCount('itens')
                ->orderBy('data_venda')
                ->orderBy('id_venda')
                ->get()
                ->map(fn (Venda $venda) => [
                    'id' => $venda->id_venda,
                    'data' => $venda->data_venda->format('Y-m-d'),
                    'cliente' => [
                        'id' => $venda->cliente->id_cliente,
                        'nome' => $venda->cliente->nome,
                        'tipo_pessoa' => $venda->cliente->tipo_pessoa,
                        'cpf_cnpj' => $venda->cliente->cpf_cnpj,
                    ],
                    'vendedor' => ['id' => $venda->vendedor->id_vendedor, 'nome' => $venda->vendedor->nome],
                    'forma_pagamento' => $venda->forma_pagamento,
                    'itens' => $venda->itens_count,
                    'subtotal' => $venda->subtotal,
                    'desconto' => $venda->desconto,
                    'total' => $venda->total,
                    'situacao' => $venda->situacao,
                ])
                ->all(),
        ];
    }

    /** Nome do PDF: `vendas-2026-10-01-a-2026-10-31.pdf`. */
    public function arquivo(): string
    {
        return "vendas-{$this->filtros['inicio']}-a-{$this->filtros['fim']}.pdf";
    }

    /** @return Builder<Venda> */
    private function doPeriodo(): Builder
    {
        return Venda::query()
            ->whereBetween('tb_venda.data_venda', [$this->filtros['inicio'], $this->filtros['fim']])
            ->when($this->filtros['vendedor'], fn (Builder $consulta, int $id) => $consulta->where('tb_venda.id_vendedor', $id))
            ->when($this->filtros['cliente'], fn (Builder $consulta, int $id) => $consulta->where('tb_venda.id_cliente', $id))
            ->when($this->filtros['forma_pagamento'], fn (Builder $consulta, string $forma) => $consulta->where('tb_venda.forma_pagamento', $forma));
    }

    /** Soma do banco (texto no MySQL, número no SQLite) como texto com 2 casas: "1500.50". */
    private static function valor(string|int|float|null $valor): string
    {
        return number_format(round((float) $valor, 2), 2, '.', '');
    }
}
