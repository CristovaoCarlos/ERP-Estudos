<?php

namespace App\Models;

use App\Support\CacheDeListagens;
use Database\Factories\ProdutoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\TenantConnection;

/**
 * Produto da prefeitura (Cadastros › Produtos, tabela `tb_produto`). A unidade é a sigla de uma
 * `Unidade` do banco central (sem chave estrangeira: ela não atravessa bancos).
 */
class Produto extends Model
{
    /** @use HasFactory<ProdutoFactory> */
    use HasFactory, TenantConnection;

    /** Origem da mercadoria na NF-e: código => descrição. */
    public const ORIGENS = [
        0 => 'Nacional',
        1 => 'Estrangeira, importação direta',
        2 => 'Estrangeira, adquirida no mercado interno',
        3 => 'Nacional, conteúdo de importação acima de 40% e até 70%',
        4 => 'Nacional, produzida conforme processos produtivos básicos',
        5 => 'Nacional, conteúdo de importação até 40%',
        6 => 'Estrangeira, importação direta, sem similar nacional (lista da CAMEX)',
        7 => 'Estrangeira, mercado interno, sem similar nacional (lista da CAMEX)',
        8 => 'Nacional, conteúdo de importação acima de 70%',
    ];

    protected $table = 'tb_produto';

    protected $primaryKey = 'id_produto';

    protected $guarded = ['id_produto'];

    /**
     * Inclusão, alteração ou exclusão tira a lista de produtos do cache. A venda guarda código e
     * descrição no item, então a lista de vendas não muda; o estoque baixado pela venda é tratado em
     * `App\Support\Vendas`.
     */
    protected static function booted(): void
    {
        $esquecer = fn () => CacheDeListagens::esquecer(CacheDeListagens::PRODUTOS);
        static::saved($esquecer);
        static::deleted($esquecer);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'preco_custo' => 'decimal:4',
            'preco_venda' => 'decimal:2',
            'controla_estoque' => 'boolean',
            'estoque_atual' => 'decimal:3',
            'estoque_minimo' => 'decimal:3',
            'origem' => 'integer',
            'peso_bruto' => 'decimal:3',
            'peso_liquido' => 'decimal:3',
            'ativo' => 'boolean',
        ];
    }

    /** Margem sobre o custo, em %: (venda − custo) ÷ custo. `null` sem custo. */
    public function margem(): ?float
    {
        $custo = (float) $this->preco_custo;

        return $custo > 0 ? round(((float) $this->preco_venda - $custo) / $custo * 100, 2) : null;
    }

    /** Estoque controlado e no mínimo ou abaixo dele. */
    public function abaixoDoMinimo(): bool
    {
        return $this->controla_estoque
            && $this->estoque_minimo !== null
            && (float) $this->estoque_atual <= (float) $this->estoque_minimo;
    }
}
