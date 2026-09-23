<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_mail_sended` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_mail_sended', function (Blueprint $table) {
            $table->string('id_mail_sended', 36);
            $table->string('mail_to', 255);
            $table->string('mail_cc', 255);
            $table->string('cc_ip', 15);
            $table->text('cc_complemento')->nullable();
            $table->string('subject_message', 50);
            $table->timestamp('created_at')->useCurrent();
            $table->primary('id_mail_sended');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_mail_sended');
    }
};
