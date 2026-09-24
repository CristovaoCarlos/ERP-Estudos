<?php

namespace App\Http\Resources;

use App\Models\Cidade;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Cidade das tabelas comuns (banco central). */

/** @mixin Cidade */
class CidadeResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_cidade,
            /** Código do município no IBGE (7 dígitos). */
            'codigo_ibge' => $this->codigo,
            'nome' => $this->descricao,
            'uf' => $this->uf,
        ];
    }
}
