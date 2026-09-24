<?php

namespace App\Http\Resources;

use App\Models\Segmento;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Segmento de arrecadação da FEBRABAN (banco central). */

/** @mixin Segmento */
class SegmentoResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'codigo' => $this->codigo,
            'descricao' => $this->descricao,
        ];
    }
}
