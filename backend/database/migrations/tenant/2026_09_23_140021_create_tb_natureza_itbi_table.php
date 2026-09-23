<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_natureza_itbi` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_natureza_itbi', function (Blueprint $table) {
            $table->integer('codigo');
            $table->string('descricao', 100);
            $table->string('permitir_transmitente', 1);
            $table->decimal('fracao_sobre_valor_venal', 18, 2);
            $table->integer('id_empresa');
            $table->increments('id_natureza_itbi');
            $table->unique(['codigo', 'id_empresa'], 'tb_natureza_itbi_codigo_id_empresa_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_natureza_itbi');
    }
};
