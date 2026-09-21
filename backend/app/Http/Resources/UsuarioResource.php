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
            'email' => $this->email,
            'prefeituras' => $this->tenants()->with('domains')->orderBy('id')->get()->map(fn (Tenant $tenant) => [
                'id' => $tenant->id,
                'dominio' => $tenant->domains->first()?->domain,
            ]),
        ];
    }
}
