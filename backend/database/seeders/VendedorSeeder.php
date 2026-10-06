<?php

namespace Database\Seeders;

use App\Models\Vendedor;
use Illuminate\Database\Seeder;

/**
 * 10 vendedores de exemplo no banco de uma prefeitura, 1 inativo. Rode por prefeitura:
 * `php artisan tenants:seed --tenants=<id> --class="Database\Seeders\VendedorSeeder"`.
 */
class VendedorSeeder extends Seeder
{
    public function run(): void
    {
        Vendedor::factory()->count(9)->create();
        Vendedor::factory()->inativo()->create();
    }
}
