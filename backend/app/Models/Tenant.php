<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

/**
 * Prefeitura cliente, cadastrada em Administração › Empresas.
 *
 * @property string $id
 * @property string|null $nome
 * @property string|null $cnpj
 * @property Carbon|null $provisionado_em
 */
class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    /** Colunas reais da tabela; o resto vai para a coluna JSON `data`. */
    public static function getCustomColumns(): array
    {
        return ['id', 'nome', 'cnpj', 'provisionado_em'];
    }

    protected function casts(): array
    {
        return ['provisionado_em' => 'datetime'];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('ativo')->withTimestamps();
    }
}
