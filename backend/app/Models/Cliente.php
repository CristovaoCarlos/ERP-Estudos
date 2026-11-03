<?php

namespace App\Models;

use App\Support\CacheDeListagens;
use Database\Factories\ClienteFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\TenantConnection;

/**
 * Cliente da prefeitura (Cadastros › Clientes, tabela `tb_cliente`): pessoa física ou jurídica,
 * com um endereço, os contatos e os dados fiscais da NF-e.
 */
class Cliente extends Model
{
    /** @use HasFactory<ClienteFactory> */
    use HasFactory, TenantConnection;

    /** Indicador da IE do destinatário na NF-e: código => rótulo. */
    public const INDICADORES_IE = [
        1 => 'Contribuinte do ICMS',
        2 => 'Contribuinte isento',
        9 => 'Não contribuinte',
    ];

    public const CONTRIBUINTE = 1;

    protected $table = 'tb_cliente';

    protected $primaryKey = 'id_cliente';

    protected $guarded = ['id_cliente'];

    /** Inclusão, alteração ou exclusão tira do cache a lista de clientes e a de vendas (que mostra o cliente). */
    protected static function booted(): void
    {
        $esquecer = fn () => CacheDeListagens::esquecer(CacheDeListagens::CLIENTES, CacheDeListagens::VENDAS);
        static::saved($esquecer);
        static::deleted($esquecer);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data_nascimento' => 'date:Y-m-d',
            'indicador_ie' => 'integer',
            'consumidor_final' => 'boolean',
            'limite_credito' => 'decimal:2',
            'latitude' => 'float',
            'longitude' => 'float',
            'ativo' => 'boolean',
        ];
    }

    /** Cidade do endereço, no banco central (o Eloquent consulta pela conexão de `Cidade`). */
    public function cidade(): BelongsTo
    {
        return $this->belongsTo(Cidade::class, 'id_cidade', 'id_cidade');
    }
}
