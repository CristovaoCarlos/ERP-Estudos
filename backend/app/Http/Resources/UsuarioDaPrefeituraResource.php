<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Usuário na tela Administração › Usuários (dados da prefeitura atual). */

/** @mixin User */
class UsuarioDaPrefeituraResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'cpf' => $this->cpf,
            'email' => $this->email,
            'foto' => $this->foto ? '/api/fotos/'.$this->foto : null,
            'superadmin' => (bool) $this->superadmin,
            /** Acesso ativo nesta prefeitura. */
            'ativo' => $this->ativoNoTenant(tenant('id')),
            'grupos' => $this->getRoleNames()->sort()->values(),
            /** Está em outra prefeitura também: aqui só dá para mudar os grupos. */
            'somente_grupos' => $this->tenants()->count() > 1,
        ];
    }
}
