<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

/**
 * Taxa SELIC de cada mês (tabela `tc_selic` do legado), no banco central. Um registro por
 * `ano` + `mes`.
 */
class Selic extends Model
{
    use CentralConnection;

    protected $table = 'tc_selic';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = ['ano' => 'integer', 'mes' => 'integer', 'valor' => 'decimal:2'];
}
