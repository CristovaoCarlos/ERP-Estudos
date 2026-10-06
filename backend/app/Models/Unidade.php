<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

/**
 * Unidade de medida dos produtos (tabela `tc_unidade`). Fica no banco central: é a mesma para
 * todas as prefeituras. A sigla é a chave e vai gravada no produto (`tb_produto.unidade`).
 */
class Unidade extends Model
{
    use CentralConnection;

    protected $table = 'tc_unidade';

    protected $primaryKey = 'sigla';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];
}
