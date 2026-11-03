<?php

namespace App\Models;

use App\Support\CacheDeListagens;
use Database\Factories\VendedorFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\TenantConnection;

/**
 * Vendedor da prefeitura (Cadastros › Vendedores, tabela `tb_vendedor`).
 */
class Vendedor extends Model
{
    /** @use HasFactory<VendedorFactory> */
    use HasFactory, TenantConnection;

    protected $table = 'tb_vendedor';

    protected $primaryKey = 'id_vendedor';

    protected $guarded = ['id_vendedor'];

    /** Inclusão, alteração ou exclusão tira do cache a lista de vendedores e a de vendas (que mostra o vendedor). */
    protected static function booted(): void
    {
        $esquecer = fn () => CacheDeListagens::esquecer(CacheDeListagens::VENDEDORES, CacheDeListagens::VENDAS);
        static::saved($esquecer);
        static::deleted($esquecer);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data_admissao' => 'date:Y-m-d',
            'comissao_percentual' => 'decimal:2',
            'meta_mensal' => 'decimal:2',
            'ativo' => 'boolean',
        ];
    }
}
