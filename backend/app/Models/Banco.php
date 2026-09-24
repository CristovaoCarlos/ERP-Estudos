<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

/**
 * Banco (tabela `tc_banco` do legado). Fica no banco central: é o mesmo para todas as prefeituras.
 */
class Banco extends Model
{
    use CentralConnection;

    protected $table = 'tc_banco';

    protected $primaryKey = 'id_banco';

    public $timestamps = false;

    protected $guarded = ['id_banco'];
}
