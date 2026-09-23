<?php

namespace App\Http\Resources;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Tenant */
class EmpresaResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'cnpj' => $this->cnpj,
            'dominio' => $this->domains->first()?->domain,
            'situacao' => $this->provisionado_em ? 'ativa' : 'provisionando',
            'criada_em' => $this->created_at?->toIso8601String(),
        ];
    }
}
