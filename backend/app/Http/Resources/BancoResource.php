<?php

namespace App\Http\Resources;

use App\Models\Banco;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Banco das tabelas internas (banco central). */

/** @mixin Banco */
class BancoResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_banco,
            /** Código de compensação (4 dígitos, com os zeros à esquerda). */
            'codigo' => $this->codigo,
            'nome' => $this->descricao,
        ];
    }
}
