<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Clientes da prefeitura (Cadastros › Clientes): pessoa física ou jurídica, com um endereço,
 * os contatos e os dados fiscais da NF-e na própria linha.
 *
 * `id_cidade` aponta para `tc_cidade`, no banco central: sem chave estrangeira, porque ela não
 * atravessa bancos. A existência é conferida na validação.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_cliente', function (Blueprint $table) {
            $table->bigIncrements('id_cliente');

            // Identificação.
            $table->char('tipo_pessoa', 1)->comment('F - física; J - jurídica');
            $table->string('cpf_cnpj', 14)->unique()->comment('CPF só com dígitos ou CNPJ normalizado (aceita o alfanumérico)');
            $table->string('nome', 150)->index()->comment('Nome (PF) ou razão social (PJ)');
            $table->string('nome_fantasia', 150)->nullable();

            // Pessoa física.
            $table->string('rg', 20)->nullable();
            $table->date('data_nascimento')->nullable();

            // Endereço.
            $table->char('cep', 8)->nullable();
            $table->string('logradouro', 150)->nullable();
            $table->string('numero', 10)->nullable();
            $table->string('complemento', 60)->nullable();
            $table->string('bairro', 60)->nullable();
            $table->integer('id_cidade')->nullable()->comment('tc_cidade.id_cidade, no banco central');

            // Contato.
            $table->string('email', 150)->nullable();
            $table->string('telefone', 11)->nullable();
            $table->string('celular', 11)->nullable();

            // Fiscal (NF-e).
            $table->tinyInteger('indicador_ie')->default(9)->comment('Indicador da IE do destinatário: 1 - contribuinte do ICMS; 2 - isento; 9 - não contribuinte');
            $table->string('inscricao_estadual', 20)->nullable();
            $table->string('inscricao_municipal', 20)->nullable();
            $table->boolean('consumidor_final')->default(true);

            // Comercial.
            $table->decimal('limite_credito', 15, 2)->nullable()->comment('Vazio: sem limite');

            // Observações e situação.
            $table->text('observacoes')->nullable();
            $table->boolean('ativo')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_cliente');
    }
};
