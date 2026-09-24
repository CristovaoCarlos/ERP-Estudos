<?php

namespace App\Http\Resources;

use App\Models\DamTipo;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Tipo de DAM (banco central). */

/** @mixin DamTipo */
class DamTipoResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'codigo' => $this->cod_dam_tipo,
            'descricao' => $this->descricao,
        ];
    }
}
