<?php

namespace App\Models;

use Spatie\Permission\Models\Role as SpatieRole;
use Stancl\Tenancy\Database\Concerns\TenantConnection;

/**
 * Fica no banco da prefeitura. Sem a conexão fixa, relações a partir do User (conexão central)
 * gravariam os vínculos no banco central.
 */
class Role extends SpatieRole
{
    use TenantConnection;
}
