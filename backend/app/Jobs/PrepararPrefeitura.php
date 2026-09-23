<?php

namespace App\Jobs;

use App\Models\Tenant;
use App\Models\User;
use App\Support\Acesso;

/** Último passo do provisionamento: cria grupos e permissões e marca a prefeitura como pronta. */
class PrepararPrefeitura
{
    public function __construct(public Tenant $tenant) {}

    public function handle(): void
    {
        $administrador = $this->tenant->administrador_id
            ? User::find($this->tenant->administrador_id)
            : null;

        $this->tenant->run(function () use ($administrador) {
            Acesso::sincronizar();
            $administrador?->assignRole(Acesso::ADMINISTRADOR);
        });

        $this->tenant->update(['provisionado_em' => now()]);
    }
}
