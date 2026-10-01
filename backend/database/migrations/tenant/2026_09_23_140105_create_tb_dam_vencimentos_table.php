<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_dam_vencimentos` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_dam_vencimentos', function (Blueprint $table) {
            $table->bigIncrements('id_dam_vencimentos');
            $table->date('vencimento_anterior');
            $table->date('vencimento_novo');
            $table->decimal('valor_anterior', 18, 2);
            $table->decimal('juros_mora', 10, 4);
            $table->decimal('multa_aplicada', 10, 4);
            $table->decimal('valor_novo', 18, 2);
            $table->unsignedBigInteger('id_dam')->nullable();
            $table->foreign('id_dam', 'tb_dam_vencimentos_id_dam_fkey')->references('id_dam')->on('tb_dam');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_dam_vencimentos');
    }
};
