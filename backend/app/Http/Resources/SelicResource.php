<?php

namespace App\Http\Resources;

use App\Models\Selic;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Taxa SELIC de um mês (banco central). */

/** @mixin Selic */
class SelicResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ano' => $this->ano,
            'mes' => $this->mes,
            /** Taxa do mês, em texto com 2 casas (ex.: `"0.87"`), para não perder precisão. */
            'valor' => $this->valor,
        ];
    }
}
