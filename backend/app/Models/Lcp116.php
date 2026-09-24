<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

/**
 * Item ou subitem da lista de serviços da Lei Complementar 116/2003 (tabela `ti_lcp116` do
 * legado), no banco central. Código com 2 dígitos é item (`01`); com ponto, subitem (`01.01`).
 */
class Lcp116 extends Model
{
    use CentralConnection;

    protected $table = 'ti_lcp116';

    protected $primaryKey = 'codigo';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    /** Só a descrição muda: o código é a chave e é usado pelos serviços das prefeituras. */
    protected $fillable = ['descricao'];
}
