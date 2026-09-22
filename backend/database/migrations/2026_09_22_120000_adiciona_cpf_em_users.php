<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * O login passa a ser pelo CPF (só dígitos). Anulável só no banco, para a migration
 * rodar com usuários já cadastrados: `usuarios:criar ... --cpf=` preenche os antigos.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('cpf', 11)->nullable()->unique()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['cpf']);
            $table->dropColumn('cpf');
        });
    }
};
