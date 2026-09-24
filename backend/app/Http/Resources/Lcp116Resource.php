<?php

namespace App\Http\Resources;

use App\Models\Lcp116;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Item ou subitem da lista de serviços da LC 116/2003 (banco central). */

/** @mixin Lcp116 */
class Lcp116Resource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'codigo' => $this->codigo,
            /** `item` (código de 2 dígitos) ou `subitem` (com ponto). */
            'tipo' => str_contains($this->codigo, '.') ? 'subitem' : 'item',
            'descricao' => $this->descricao,
        ];
    }
}
