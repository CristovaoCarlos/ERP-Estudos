<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

use function Laravel\Prompts\password;

#[Signature('usuarios:criar {email} {nome} {--tenant=* : Id do tenant a que o usuário terá acesso} {--senha= : Senha (se omitida, é solicitada)}')]
#[Description('Cria ou atualiza um usuário central e o vincula aos tenants informados')]
class CriarUsuario extends Command
{
    public function handle(): int
    {
        $tenantIds = $this->option('tenant');
        $inexistentes = array_diff($tenantIds, Tenant::whereKey($tenantIds)->pluck('id')->all());

        if ($inexistentes) {
            $this->error('Tenant(s) inexistente(s): '.implode(', ', $inexistentes));

            return self::FAILURE;
        }

        $senha = $this->option('senha') ?? password('Senha', required: true);

        $user = User::updateOrCreate(
            ['email' => $this->argument('email')],
            ['name' => $this->argument('nome'), 'password' => $senha],
        );
        $user->tenants()->syncWithoutDetaching($tenantIds);

        $this->info("Usuário {$user->email} com acesso a: ".($user->tenants()->pluck('id')->implode(', ') ?: 'nenhum tenant'));

        return self::SUCCESS;
    }
}
