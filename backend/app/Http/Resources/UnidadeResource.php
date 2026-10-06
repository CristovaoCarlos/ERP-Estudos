<?php

namespace App\Http\Resources;

use App\Models\Unidade;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Unidade */
class UnidadeResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'sigla' => $this->sigla,
            'descricao' => $this->descricao,
        ];
    }
}
