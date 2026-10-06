<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Produtos da prefeitura (Cadastros › Produtos): identificação, preços, estoque, dados fiscais da
 * NF-e e pesos. O estoque atual é editado no cadastro até existir a movimentação de estoque.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_produto', function (Blueprint $table) {
            $table->bigIncrements('id_produto');

            // Identificação.
            $table->string('codigo', 30)->unique()->comment('Código interno (SKU)');
            $table->string('descricao', 120)->index()->comment('Nome na venda e na NF-e');
            $table->string('codigo_barras', 14)->nullable()->unique()->comment('GTIN/EAN, só dígitos');
            $table->string('unidade', 6)->comment('UN, KG, L, CX...');
            $table->string('categoria', 60)->nullable()->index();

            // Preços.
            $table->decimal('preco_custo', 15, 4)->nullable();
            $table->decimal('preco_venda', 15, 2);

            // Estoque.
            $table->boolean('controla_estoque')->default(true);
            $table->decimal('estoque_atual', 15, 3)->default(0);
            $table->decimal('estoque_minimo', 15, 3)->nullable();

            // Fiscal (NF-e).
            $table->char('ncm', 8)->nullable();
            $table->char('cest', 7)->nullable();
            $table->tinyInteger('origem')->default(0)->comment('Origem da mercadoria na NF-e (0 a 8)');

            // Pesos, em kg.
            $table->decimal('peso_bruto', 12, 3)->nullable();
            $table->decimal('peso_liquido', 12, 3)->nullable();

            $table->text('observacoes')->nullable();
            $table->boolean('ativo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_produto');
    }
};
