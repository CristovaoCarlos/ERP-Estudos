<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Relatórios pedidos para gerar em segundo plano (fila): quem pediu, com que filtros, em que pé
 * está e onde ficou o arquivo. `user_id` não tem FK porque o usuário mora no banco central.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_relatorio_gerado', function (Blueprint $table) {
            $table->bigIncrements('id_relatorio_gerado');
            $table->unsignedBigInteger('user_id')->index()->comment('Usuário do banco central que pediu');
            $table->string('tipo', 40)->comment('Relatório, ex.: vendas_periodo');
            $table->json('filtros');
            $table->string('situacao', 20)->default('pendente')->comment('pendente, processando, pronto ou falhou');
            $table->string('arquivo')->nullable()->comment('Caminho no disco local da prefeitura');
            $table->string('erro')->nullable();
            $table->timestamp('concluido_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_relatorio_gerado');
    }
};
