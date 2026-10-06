<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Unidades de medida dos produtos (Administração › Tabelas Comuns › Unidades), no banco central:
 * valem para todas as prefeituras. Já nasce com as unidades mais usadas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tc_unidade', function (Blueprint $table) {
            $table->string('sigla', 6)->primary()->comment('UN, KG, L... vai no produto e na NF-e');
            $table->string('descricao', 60);
        });

        DB::table('tc_unidade')->insert(array_map(
            fn (string $sigla, string $descricao) => ['sigla' => $sigla, 'descricao' => $descricao],
            ['UN', 'PC', 'CX', 'KG', 'G', 'L', 'ML', 'M', 'M2', 'M3', 'PAR', 'DZ', 'KIT'],
            ['Unidade', 'Peça', 'Caixa', 'Quilograma', 'Grama', 'Litro', 'Mililitro', 'Metro',
                'Metro quadrado', 'Metro cúbico', 'Par', 'Dúzia', 'Kit'],
        ));
    }

    public function down(): void
    {
        Schema::dropIfExists('tc_unidade');
    }
};
