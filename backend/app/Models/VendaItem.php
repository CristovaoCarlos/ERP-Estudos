<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\TenantConnection;

/**
 * Item de uma venda (tabela `tb_venda_item`), com a descrição, a unidade e o preço do momento da
 * venda. `baixou_estoque` diz se o item saiu do estoque, para devolvê-lo no cancelamento.
 */
class VendaItem extends Model
{
    use TenantConnection;

    protected $table = 'tb_venda_item';

    protected $primaryKey = 'id_venda_item';

    protected $guarded = ['id_venda_item'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantidade' => 'decimal:3',
            'preco_unitario' => 'decimal:2',
            'desconto' => 'decimal:2',
            'total' => 'decimal:2',
            'baixou_estoque' => 'boolean',
        ];
    }

    /** @return BelongsTo<Produto, $this> */
    public function produto(): BelongsTo
    {
        return $this->belongsTo(Produto::class, 'id_produto');
    }
}
