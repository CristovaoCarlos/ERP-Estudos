<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\TenantConnection;

/** Receita tributária da prefeitura: tabela `tb_receita` do legado. */
class Receita extends Model
{
    use TenantConnection;

    protected $table = 'tb_receita';

    protected $primaryKey = 'id_receita';

    public $timestamps = false;

    protected $guarded = ['id_receita'];
}
