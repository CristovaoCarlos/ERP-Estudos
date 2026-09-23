<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Status do acesso do usuário **em cada prefeitura**: desativado numa, ele continua trabalhando
 * nas outras. Quem desativa é um administrador da prefeitura (permissão `administracao.usuarios`).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_user', function (Blueprint $table) {
            $table->boolean('ativo')->default(true)->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_user', function (Blueprint $table) {
            $table->dropColumn('ativo');
        });
    }
};
