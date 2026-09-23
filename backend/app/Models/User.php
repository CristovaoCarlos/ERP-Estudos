<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\Acesso;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

#[Fillable(['name', 'cpf', 'email', 'foto', 'password', 'superadmin'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use CentralConnection, HasApiTokens, HasFactory, HasRoles, Notifiable;

    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class)->withPivot('ativo')->withTimestamps();
    }

    /** Vínculo **ativo** com a prefeitura: é o que permite entrar e usar o sistema. */
    public function acessaTenant(string $tenantId): bool
    {
        return $this->tenants()->whereKey($tenantId)->wherePivot('ativo', true)->exists();
    }

    /** Vínculo com a prefeitura, ativo ou não (o desativado continua em Administração › Usuários). */
    public function vinculadoAoTenant(string $tenantId): bool
    {
        return $this->tenants()->whereKey($tenantId)->exists();
    }

    /** `false` quando o acesso do usuário a esta prefeitura está desativado. */
    public function ativoNoTenant(string $tenantId): bool
    {
        return (bool) $this->tenants()->whereKey($tenantId)->value('ativo');
    }

    /** Superadmin com efeito: só na prefeitura da Lemarq (`config('acesso.tenant_administrador')`). */
    public function ehSuperadmin(): bool
    {
        return $this->superadmin && Acesso::naPrefeituraAdministradora();
    }

    /** @return list<string> permissões na prefeitura atual (superadmin: todas, inclusive Empresas) */
    public function permissoesNaPrefeitura(): array
    {
        if ($this->ehSuperadmin()) {
            return [...Acesso::permissoes(), Acesso::EMPRESAS];
        }

        return $this->getAllPermissions()->pluck('name')->sort()->values()->all();
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'superadmin' => 'boolean',
        ];
    }
}
