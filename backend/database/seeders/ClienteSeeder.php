<?php

namespace Database\Seeders;

use App\Models\Cliente;
use Illuminate\Database\Seeder;

/**
 * 25 clientes de exemplo no banco de uma prefeitura: 15 pessoas físicas e 10 jurídicas, com 3
 * inativos. Rode por prefeitura:
 * `php artisan tenants:seed --tenants=<id> --class="Database\Seeders\ClienteSeeder"`.
 */
class ClienteSeeder extends Seeder
{
    public function run(): void
    {
        Cliente::factory()->count(13)->create();
        Cliente::factory()->inativo()->count(2)->create();
        Cliente::factory()->juridica()->count(9)->create();
        Cliente::factory()->juridica()->inativo()->create();
    }
}
