<?php

namespace App\Http\Resources;

use App\Models\Produto;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Produto */
class ProdutoResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_produto,
            'codigo' => $this->codigo,
            'descricao' => $this->descricao,
            'codigo_barras' => $this->codigo_barras,
            'unidade' => $this->unidade,
            'categoria' => $this->categoria,
            'precos' => [
                'custo' => $this->preco_custo,
                'venda' => $this->preco_venda,
                /** Margem sobre o custo, em %; `null` sem custo. */
                'margem' => $this->margem(),
            ],
            'estoque' => [
                'controla' => $this->controla_estoque,
                'atual' => $this->estoque_atual,
                'minimo' => $this->estoque_minimo,
                /** No mínimo ou abaixo dele (só com estoque controlado). */
                'abaixo_do_minimo' => $this->abaixoDoMinimo(),
            ],
            'fiscal' => [
                'ncm' => $this->ncm,
                'cest' => $this->cest,
                'origem' => $this->origem,
            ],
            'pesos' => [
                'bruto' => $this->peso_bruto,
                'liquido' => $this->peso_liquido,
            ],
            'observacoes' => $this->observacoes,
            'ativo' => $this->ativo,
        ];
    }
}
