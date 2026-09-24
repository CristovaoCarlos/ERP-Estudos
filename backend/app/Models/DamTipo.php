<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

/**
 * Tipo de DAM (tabela `ti_dam_tipo` do legado), no banco central: nota fiscal, alvará, IPTU,
 * ITBI, taxas, habite-se… O código é usado pelos documentos das prefeituras (`tb_doc`).
 */
class DamTipo extends Model
{
    use CentralConnection;

    protected $table = 'ti_dam_tipo';

    protected $primaryKey = 'cod_dam_tipo';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];
}
