<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Support\Acesso;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('acesso:sincronizar {--tenant=* : Id da prefeitura (se omitido, todas)}')]
#[Description('Cria ou atualiza os grupos de acesso e as permissões (config/acesso.php) nas prefeituras')]
class SincronizarAcesso extends Command
{
    public function handle(): int
    {
        $ids = $this->option('tenant');
        $tenants = $ids ? Tenant::whereKey($ids)->get() : Tenant::all();
        $inexistentes = array_diff($ids, $tenants->modelKeys());

        if ($inexistentes) {
            $this->error('Tenant(s) inexistente(s): '.implode(', ', $inexistentes));

            return self::FAILURE;
        }

        foreach ($tenants as $tenant) {
            $tenant->run(fn () => Acesso::sincronizar());
            $this->info("{$tenant->id}: ".count(Acesso::permissoes()).' permissões, grupos '.implode(', ', array_keys(Acesso::grupos())));
        }

        return self::SUCCESS;
    }
}
