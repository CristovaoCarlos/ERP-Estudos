<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

/**
 * Segmento de arrecadação da FEBRABAN (tabela `ti_segmentos` do legado), no banco central.
 * O código (1 dígito) vai no código de barras e em `tb_convenio.febraban_segmento`.
 */
class Segmento extends Model
{
    use CentralConnection;

    protected $table = 'ti_segmentos';

    protected $primaryKey = 'codigo';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    /** Só a descrição muda: o código é a chave e é usado pelos convênios das prefeituras. */
    protected $fillable = ['descricao'];
}
