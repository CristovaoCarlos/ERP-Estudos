<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\TenantConnection;

/**
 * Receita usada por cada tributo no lançamento (tabela `tb_parametro_receita` do legado).
 * Um registro só por prefeitura: o banco já é dela.
 */
class ParametroReceita extends Model
{
    use TenantConnection;

    /**
     * Tributos parametrizados: chave usada na API => rótulo da tela. A coluna é `id_receita_<chave>`.
     */
    public const TRIBUTOS = [
        'iss' => 'ISS',
        'taxa' => 'Taxa',
        'tll' => 'TLL',
        'irpf' => 'IRPF',
        'irpj' => 'IRPJ',
        'inss' => 'INSS',
        'itbi' => 'ITBI',
        'habite' => 'Habite-se',
        'iptu' => 'IPTU',
        'tcl' => 'TCL',
        'tcc' => 'TCC',
        'tip' => 'TIP',
        'tlp' => 'TLP',
    ];

    protected $table = 'tb_parametro_receita';

    protected $primaryKey = 'id_parametro_receita';

    public $timestamps = false;

    protected $guarded = ['id_parametro_receita'];

    /** O registro da prefeitura; sem nenhum gravado, um novo (ainda não salvo), com tudo vazio. */
    public static function atual(): self
    {
        return self::orderBy('id_parametro_receita')->firstOrNew();
    }

    public static function coluna(string $tributo): string
    {
        return "id_receita_{$tributo}";
    }
}
