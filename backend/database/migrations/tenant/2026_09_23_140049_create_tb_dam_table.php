<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_dam` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_dam', function (Blueprint $table) {
            $table->bigIncrements('id_dam');
            $table->unsignedBigInteger('id_contribuinte');
            $table->date('data_emissao')->nullable();
            $table->date('data_vencimento')->nullable();
            $table->string('status', 1);
            $table->decimal('valor_documento', 18, 2)->default(0.0);
            $table->decimal('valor_adicionado', 18, 2)->default(0.0);
            $table->decimal('valor_abatido', 18, 2)->default(0.0);
            $table->decimal('valor_total', 18, 2)->default(0.0);
            $table->text('observacao')->nullable();
            $table->text('pix_referencia')->nullable();
            $table->text('pix_qrcode')->nullable();
            $table->string('codigo_barra', 44)->nullable();
            $table->string('linha_digitavel', 70)->nullable();
            $table->integer('id_origem')->nullable();
            $table->text('motivo_cancelamento')->nullable();
            $table->date('data_cancelamento')->nullable();
            $table->boolean('lock')->default(false);
            $table->timestamp('checked_pix_at')->useCurrent();
            $table->date('data_pagamento')->nullable();
            $table->date('data_vencimento_original')->nullable();
            $table->decimal('juros', 18, 4)->nullable()->default(0);
            $table->decimal('multa', 18, 4)->nullable()->default(0);
            $table->integer('numero_parcela')->nullable()->default(0);
            $table->string('tipo_baixa', 1)->nullable();
            $table->string('descricao_baixa_manual', 255)->nullable();
            $table->string('descricao_conta_pagamento_baixa_manual', 255)->nullable();
            $table->index(['status', 'data_emissao'], 'idx_tb_dam_status_data_emissao');
            $table->index(['status', 'data_pagamento'], 'idx_tb_dam_status_data_pagamento');
            $table->foreign('id_contribuinte', 'tb_dam_tb_contribuinte_fk')->references('id_contribuinte')->on('tb_contribuinte');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_dam');
    }
};
