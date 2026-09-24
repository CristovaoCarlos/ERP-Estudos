<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

/**
 * Tipo de numeração da nota fiscal (tabela `ti_nota_numeracao` do legado), no banco central.
 * O código (1 letra) é gravado em `tb_parametro_nota_fiscal.tipo_numeracao` nas prefeituras.
 */
class NotaNumeracao extends Model
{
    use CentralConnection;

    protected $table = 'ti_nota_numeracao';

    protected $primaryKey = 'cod_numeracao';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];
}
