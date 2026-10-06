<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Vendas da prefeitura (Lançamentos › Vendas) e seus itens. A venda registrada não se altera: ou
 * fica finalizada, ou é cancelada (e os itens voltam ao estoque). Os itens guardam código,
 * descrição, unidade e preço do momento da venda, para o histórico não mudar com o cadastro do produto.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_venda', function (Blueprint $table) {
            $table->bigIncrements('id_venda');
            $table->date('data_venda')->index();
            $table->unsignedBigInteger('id_cliente');
            $table->unsignedBigInteger('id_vendedor');
            $table->string('forma_pagamento', 20)->comment('dinheiro, pix, cartao_credito...');
            $table->decimal('subtotal', 15, 2)->comment('Soma dos itens, já com o desconto de cada um');
            $table->decimal('desconto', 15, 2)->default(0)->comment('Desconto sobre o subtotal');
            $table->decimal('total', 15, 2);
            $table->text('observacoes')->nullable();
            $table->string('situacao', 10)->default('finalizada')->index()->comment('finalizada ou cancelada');
            $table->timestamp('cancelada_em')->nullable();
            $table->timestamps();

            $table->foreign('id_cliente')->references('id_cliente')->on('tb_cliente')->restrictOnDelete();
            $table->foreign('id_vendedor')->references('id_vendedor')->on('tb_vendedor')->restrictOnDelete();
        });

        Schema::create('tb_venda_item', function (Blueprint $table) {
            $table->bigIncrements('id_venda_item');
            $table->unsignedBigInteger('id_venda');
            $table->unsignedBigInteger('id_produto');
            $table->string('codigo', 30)->comment('Código do produto na data da venda');
            $table->string('descricao', 120)->comment('Descrição do produto na data da venda');
            $table->string('unidade', 6);
            $table->decimal('quantidade', 15, 3);
            $table->decimal('preco_unitario', 15, 2);
            $table->decimal('desconto', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->comment('Quantidade × preço − desconto');
            $table->boolean('baixou_estoque')->comment('Saiu do estoque na venda (e volta no cancelamento)');
            $table->timestamps();

            $table->foreign('id_venda')->references('id_venda')->on('tb_venda')->cascadeOnDelete();
            $table->foreign('id_produto')->references('id_produto')->on('tb_produto')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_venda_item');
        Schema::dropIfExists('tb_venda');
    }
};
