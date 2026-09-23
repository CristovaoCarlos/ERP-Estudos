<?php

namespace App\Http\Resources;

use App\Models\Role;
use App\Support\Acesso;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Grupo de acesso da prefeitura (papel do spatie). */

/** @mixin Role */
class GrupoResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->name,
            /** Telas do grupo: uma permissão por tela do menu. */
            'telas' => $this->permissions->pluck('name')->sort()->values(),
            'usuarios' => $this->usuarios,
            /** Grupo do sistema (Administrador): não pode ser alterado nem excluído. */
            'sistema' => $this->name === Acesso::ADMINISTRADOR,
        ];
    }
}
