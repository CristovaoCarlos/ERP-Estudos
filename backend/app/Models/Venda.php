<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Database\Concerns\TenantConnection;

/**
 * Venda da prefeitura (Lançamentos › Vendas, tabela `tb_venda`). Registrada por `App\Support\Vendas`,
 * que dá baixa no estoque; não se altera depois, só se cancela.
 */
class Venda extends Model
{
    use TenantConnection;

    /** Formas de pagamento: código => descrição. */
    public const FORMAS_DE_PAGAMENTO = [
        'dinheiro' => 'Dinheiro',
        'pix' => 'Pix',
        'cartao_debito' => 'Cartão de débito',
        'cartao_credito' => 'Cartão de crédito',
        'boleto' => 'Boleto',
        'crediario' => 'Crediário',
    ];

    public const FINALIZADA = 'finalizada';

    public const CANCELADA = 'cancelada';

    protected $table = 'tb_venda';

    protected $primaryKey = 'id_venda';

    protected $guarded = ['id_venda'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data_venda' => 'date:Y-m-d',
            'subtotal' => 'decimal:2',
            'desconto' => 'decimal:2',
            'total' => 'decimal:2',
            'cancelada_em' => 'datetime',
        ];
    }

    /** @return HasMany<VendaItem, $this> */
    public function itens(): HasMany
    {
        return $this->hasMany(VendaItem::class, 'id_venda')->orderBy('id_venda_item');
    }

    /** @return BelongsTo<Cliente, $this> */
    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'id_cliente');
    }

    /** @return BelongsTo<Vendedor, $this> */
    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Vendedor::class, 'id_vendedor');
    }

    public function cancelada(): bool
    {
        return $this->situacao === self::CANCELADA;
    }
}
