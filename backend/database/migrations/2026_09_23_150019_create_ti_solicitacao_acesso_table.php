<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_solicitacao_acesso` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_solicitacao_acesso', function (Blueprint $table) {
            $table->string('id', 36);
            $table->string('sistema', 10);
            $table->timestamp('data_hora');
            $table->timestamp('data_hora_envio');
            $table->string('nome', 100);
            $table->string('email', 100);
            $table->string('telefone', 20);
            $table->string('cnpj', 14);
            $table->string('razao_social', 100);
            $table->string('autorizado', 1);
            $table->primary('id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_solicitacao_acesso');
    }
};
