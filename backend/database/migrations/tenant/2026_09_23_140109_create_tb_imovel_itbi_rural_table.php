<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_imovel_itbi_rural` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_imovel_itbi_rural', function (Blueprint $table) {
            $table->bigInteger('id_imovel');
            $table->string('nirf', 20)->nullable();
            $table->string('ccir', 20)->nullable();
            $table->decimal('area_total_hec', 18, 2)->nullable();
            $table->decimal('area_agricultura', 18, 2)->nullable();
            $table->decimal('area_preservacao', 18, 2)->nullable();
            $table->decimal('valor_venal', 18, 2);
            $table->primary('id_imovel');
            $table->foreign('id_imovel', 'tb_imovel_itbi_rural_id_imovel_fkey')->references('id_imovel')->on('tb_imovel');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_imovel_itbi_rural');
    }
};
