<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_empresa` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_empresa', function (Blueprint $table) {
            $table->bigIncrements('id_empresa');
            $table->string('cnpj_empresa', 14);
            $table->text('razao_social');
            $table->string('use_license', 1)->nullable()->default('S');
            $table->unique(['cnpj_empresa'], 'tb_empresa_cnpj_empresa_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_empresa');
    }
};
