<?php

namespace App\Http\Resources;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UsuarioResource extends JsonResource
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
            'superadmin' => $this->ehSuperadmin(),
            'grupos' => $this->getRoleNames()->sort()->values(),
            'permissoes' => $this->permissoesNaPrefeitura(),
            'prefeituras' => $this->tenants()->with('domains')->orderBy('id')->get()->map(fn (Tenant $tenant) => [
                'id' => $tenant->id,
                'nome' => $tenant->nome,
                'dominio' => $tenant->domains->first()?->domain,
            ]),
        ];
    }
}
