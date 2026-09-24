<?php

namespace App\Http\Resources;

use App\Models\NotaNumeracao;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Tipo de numeração da nota fiscal (banco central). */

/** @mixin NotaNumeracao */
class NotaNumeracaoResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            /** Uma letra (ex.: `A` automático, `D` por data, `N` normal). */
            'codigo' => $this->cod_numeracao,
            'descricao' => $this->descricao,
        ];
    }
}
