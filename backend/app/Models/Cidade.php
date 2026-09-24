<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

/**
 * Cidade (tabela `tc_cidade` do legado). Fica no banco central: é a mesma para todas as prefeituras.
 */
class Cidade extends Model
{
    use CentralConnection;

    protected $table = 'tc_cidade';

    protected $primaryKey = 'id_cidade';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];
}
