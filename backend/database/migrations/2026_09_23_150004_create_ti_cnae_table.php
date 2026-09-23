<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_cnae` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_cnae', function (Blueprint $table) {
            $table->increments('codigo');
            $table->string('sessao', 1);
            $table->string('divisao', 2)->nullable();
            $table->string('grupo', 4)->nullable();
            $table->string('classe', 8)->nullable();
            $table->string('subclasse', 9)->nullable();
            $table->string('denominacao', 200);
            $table->string('versao', 4)->nullable();
            $table->boolean('ativo')->nullable();
            $table->text('nota_explicativa')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_cnae');
    }
};
