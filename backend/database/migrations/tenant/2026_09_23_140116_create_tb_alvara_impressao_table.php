<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_alvara_impressao` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_alvara_impressao', function (Blueprint $table) {
            $table->unsignedBigInteger('id_doc');
            $table->string('data_emissao', 15)->nullable();
            $table->string('data_fim', 15)->nullable();
            $table->string('tipo_alvara', 50)->nullable();
            $table->string('contribuinte_razao_social', 150)->nullable();
            $table->string('contribuinte_nome_fantasia', 100)->nullable();
            $table->string('contribuinte_cpf_cnpj', 14)->nullable();
            $table->string('contribuinte_insc_municipal', 20)->nullable();
            $table->string('contribuinte_insc_estadual', 20)->nullable();
            $table->text('contribuinte_endereco')->nullable();
            $table->text('observacao')->nullable();
            $table->string('hora_semanal', 31)->nullable();
            $table->string('hora_sabado', 31)->nullable();
            $table->string('hora_domingo', 31)->nullable();
            $table->text('cnaes')->nullable();
            $table->text('tipos_cnaes')->nullable();
            $table->string('data_inicio', 15)->nullable();
            $table->string('obra_endereco', 255)->nullable();
            $table->string('obra_autor_projeto', 180)->nullable();
            $table->string('obra_autor_cau', 30)->nullable();
            $table->string('obra_resp_tecnico', 180)->nullable();
            $table->string('obra_resp_tecnico_crea', 30)->nullable();
            $table->string('obra_responsavel_firma', 180)->nullable();
            $table->string('obra_responsavel_firma_cpf_cnpj', 20)->nullable();
            $table->text('obra_especificacao')->nullable();
            $table->text('obra_observacao')->nullable();
            $table->text('obra_finalidade')->nullable();
            $table->primary('id_doc');
            $table->foreign('id_doc', 'tb_alvara_impressao_tb_alvara_fk')->references('id_doc')->on('tb_alvara');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_alvara_impressao');
    }
};
