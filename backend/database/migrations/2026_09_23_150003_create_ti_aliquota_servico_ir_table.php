<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_aliquota_servico_ir` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_aliquota_servico_ir', function (Blueprint $table) {
            $table->bigIncrements('id_aliquota_ir');
            $table->text('descricao');
            $table->decimal('aliquota', 5, 2);
            $table->integer('ano');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_aliquota_servico_ir');
    }
};
