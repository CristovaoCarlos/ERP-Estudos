<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Localização do endereço do cliente no padrão do Google Maps: latitude e longitude em graus
 * decimais (WGS 84), 7 casas (cerca de 1 cm).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_cliente', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('id_cidade');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('tb_cliente', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
