<?php

namespace App\Models;

use Spatie\Permission\Models\Permission as SpatiePermission;
use Stancl\Tenancy\Database\Concerns\TenantConnection;

/**
 * Fica no banco da prefeitura. Sem a conexão fixa, relações a partir do User (conexão central)
 * gravariam os vínculos no banco central.
 */
class Permission extends SpatiePermission
{
    use TenantConnection;
}
