<?php

namespace App\Http\Resources;

use App\Models\ParametroReceita;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Receita usada por cada tributo na prefeitura. */

/** @mixin ParametroReceita */
class ParametroReceitaResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            /** Id da receita (`tb_receita`) de cada tributo, ou null quando não configurada. */
            'receitas' => collect(ParametroReceita::TRIBUTOS)
                ->mapWithKeys(fn ($rotulo, $tributo) => [$tributo => $this->{ParametroReceita::coluna($tributo)}]),
        ];
    }
}
