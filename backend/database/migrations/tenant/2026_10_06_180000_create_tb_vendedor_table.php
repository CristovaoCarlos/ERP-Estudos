<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Vendedores da prefeitura (Cadastros › Vendedores): identificação, contato e condições comerciais
 * (comissão, meta e região de atuação).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_vendedor', function (Blueprint $table) {
            $table->bigIncrements('id_vendedor');
            $table->string('nome', 150)->index();
            $table->char('cpf', 11)->unique();
            $table->date('data_admissao')->nullable();
            $table->string('email', 150)->nullable();
            $table->string('celular', 11);
            $table->string('telefone', 11)->nullable();
            $table->decimal('comissao_percentual', 5, 2)->default(0)->comment('% sobre as vendas');
            $table->decimal('meta_mensal', 15, 2)->nullable()->comment('Meta de vendas por mês, em R$');
            $table->string('regiao', 60)->nullable()->index()->comment('Região ou área de atuação');
            $table->text('observacoes')->nullable();
            $table->boolean('ativo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_vendedor');
    }
};
