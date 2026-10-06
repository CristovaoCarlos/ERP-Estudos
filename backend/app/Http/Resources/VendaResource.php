<?php

namespace App\Http\Resources;

use App\Models\Venda;
use App\Models\VendaItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Venda */
class VendaResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_venda,
            'data' => $this->data_venda->format('Y-m-d'),
            'cliente' => $this->whenLoaded('cliente', fn () => [
                'id' => $this->cliente->id_cliente,
                'nome' => $this->cliente->nome,
                'tipo_pessoa' => $this->cliente->tipo_pessoa,
                'cpf_cnpj' => $this->cliente->cpf_cnpj,
            ]),
            'vendedor' => $this->whenLoaded('vendedor', fn () => [
                'id' => $this->vendedor->id_vendedor,
                'nome' => $this->vendedor->nome,
            ]),
            'forma_pagamento' => $this->forma_pagamento,
            'subtotal' => $this->subtotal,
            'desconto' => $this->desconto,
            'total' => $this->total,
            'observacoes' => $this->observacoes,
            'situacao' => $this->situacao,
            'registrada_em' => $this->created_at?->toIso8601String(),
            'cancelada_em' => $this->cancelada_em?->toIso8601String(),
            'itens' => $this->whenLoaded('itens', fn () => $this->itens->map(fn (VendaItem $item) => [
                'id' => $item->id_venda_item,
                'produto' => $item->id_produto,
                'codigo' => $item->codigo,
                'descricao' => $item->descricao,
                'unidade' => $item->unidade,
                'quantidade' => $item->quantidade,
                'preco_unitario' => $item->preco_unitario,
                'desconto' => $item->desconto,
                'total' => $item->total,
                'baixou_estoque' => $item->baixou_estoque,
            ])),
        ];
    }
}
