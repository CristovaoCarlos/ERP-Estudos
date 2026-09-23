<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Cada tenant é uma empresa (prefeitura cliente) cadastrada em Administração › Empresas.
 * `provisionado_em` é preenchido quando o banco da prefeitura fica pronto.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('nome')->nullable()->after('id');
            $table->string('cnpj', 14)->nullable()->unique()->after('nome');
            $table->timestamp('provisionado_em')->nullable()->after('cnpj');
        });

        // Tenants anteriores ao cadastro de empresas: nome a partir do id; já estão provisionados.
        foreach (DB::table('tenants')->get(['id', 'created_at']) as $tenant) {
            DB::table('tenants')->where('id', $tenant->id)->update([
                'nome' => Str::headline($tenant->id),
                'provisionado_em' => $tenant->created_at ?? now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropUnique(['cnpj']);
            $table->dropColumn(['nome', 'cnpj', 'provisionado_em']);
        });
    }
};
