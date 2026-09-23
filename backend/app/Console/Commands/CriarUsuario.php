<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Cpf;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

#[Signature('usuarios:criar {email} {nome} {--cpf= : CPF usado no login (se omitido num usuário sem CPF, é solicitado)} {--tenant=* : Id do tenant a que o usuário terá acesso} {--grupo=* : Grupo de acesso nos tenants informados (ex.: Parâmetros)} {--superadmin : Marca como superadmin da Lemarq} {--senha= : Senha (se omitida, é solicitada)}')]
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

        $grupos = $this->option('grupo');
        if ($grupos && ! $tenantIds) {
            $this->error('Informe --tenant para dar grupos de acesso.');

            return self::FAILURE;
        }

        $existente = User::where('email', $this->argument('email'))->first();
        $cpf = $this->option('cpf') ?? $existente?->cpf ?? text('CPF', required: true);

        if (! Cpf::valido($cpf)) {
            $this->error("CPF inválido: {$cpf}");

            return self::FAILURE;
        }

        $cpf = Cpf::digitos($cpf);

        if (User::where('cpf', $cpf)->where('email', '!=', $this->argument('email'))->exists()) {
            $this->error("CPF {$cpf} já pertence a outro usuário.");

            return self::FAILURE;
        }

        $senha = $this->option('senha') ?? password('Senha', required: true);

        $user = User::updateOrCreate(
            ['email' => $this->argument('email')],
            ['name' => $this->argument('nome'), 'cpf' => $cpf, 'password' => $senha],
        );
        $user->tenants()->syncWithoutDetaching($tenantIds);

        if ($this->option('superadmin')) {
            $user->update(['superadmin' => true]);
        }

        foreach (Tenant::findMany($tenantIds) as $tenant) {
            $faltando = $tenant->run(function () use ($user, $grupos) {
                $faltando = array_diff($grupos, Role::whereIn('name', $grupos)->pluck('name')->all());
                if (! $faltando) {
                    $user->assignRole($grupos);
                }

                return $faltando;
            });

            if ($faltando) {
                $this->error("Grupo(s) inexistente(s) em {$tenant->id}: ".implode(', ', $faltando).'. Rode acesso:sincronizar.');

                return self::FAILURE;
            }
        }

        $this->info("Usuário {$user->email} (CPF {$user->cpf}) com acesso a: ".($user->tenants()->pluck('id')->implode(', ') ?: 'nenhum tenant'));

        return self::SUCCESS;
    }
}
