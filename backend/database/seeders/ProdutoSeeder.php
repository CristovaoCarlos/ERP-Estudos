<?php

namespace Database\Seeders;

use App\Models\Produto;
use Illuminate\Database\Seeder;

/**
 * 25 produtos de exemplo no banco de uma prefeitura: 18 com estoque em dia, 3 com estoque baixo,
 * 2 sem controle de estoque e 2 inativos. Rode por prefeitura:
 * `php artisan tenants:seed --tenants=<id> --class="Database\Seeders\ProdutoSeeder"`.
 */
class ProdutoSeeder extends Seeder
{
    public function run(): void
    {
        Produto::factory()->count(18)->create();
        Produto::factory()->estoqueBaixo()->count(3)->create();
        Produto::factory()->semEstoque()->count(2)->create();
        Produto::factory()->inativo()->count(2)->create();
    }
}
