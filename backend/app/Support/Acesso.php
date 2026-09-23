<?php

namespace App\Support;

use App\Models\Permission;
use App\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/** Grupos de acesso e permissões por tela, definidos em `config/acesso.php`. */
class Acesso
{
    /** Tela exclusiva do superadmin: fica fora do catálogo e não pode ser dada a grupos. */
    public const EMPRESAS = 'administracao.empresas';

    /** Grupo do sistema: tem todas as telas, não pode ser alterado nem excluído. */
    public const ADMINISTRADOR = 'Administrador';

    public const GUARD = 'web';

    /** @return list<string> todas as permissões do catálogo */
    public static function permissoes(): array
    {
        return array_merge(...array_values(config('acesso.permissoes')));
    }

    /** @return array<string, list<string>> nome do grupo => permissões */
    public static function grupos(): array
    {
        return [
            self::ADMINISTRADOR => self::permissoes(),
            ...array_map(
                fn (string $modulo) => config("acesso.permissoes.{$modulo}", []),
                config('acesso.grupos'),
            ),
        ];
    }

    /**
     * Acerta as permissões da prefeitura atual (as fora do catálogo são apagadas) e cria os grupos
     * padrão que não existirem. Grupos existentes não são tocados: quem manda neles é a tela
     * Administração › Grupos de acesso.
     */
    public static function sincronizar(): void
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->forgetCachedPermissions();

        $permissoes = self::permissoes();
        foreach ($permissoes as $nome) {
            Permission::findOrCreate($nome, self::GUARD);
        }
        Permission::whereNotIn('name', $permissoes)->delete();
        $registrar->forgetCachedPermissions();

        foreach (self::grupos() as $grupo => $permissoesDoGrupo) {
            $existente = Role::where('name', $grupo)->first();

            if (! $existente) {
                Role::create(['name' => $grupo, 'guard_name' => self::GUARD])
                    ->syncPermissions($permissoesDoGrupo);

                continue;
            }

            // O Administrador acompanha o catálogo: tela nova entra nele automaticamente.
            if ($grupo === self::ADMINISTRADOR) {
                $existente->syncPermissions($permissoesDoGrupo);
            }
        }

        $registrar->forgetCachedPermissions();
    }

    /** A prefeitura atual é a da Lemarq (a única em que o superadmin tem poderes). */
    public static function naPrefeituraAdministradora(): bool
    {
        return tenancy()->initialized && tenant('id') === config('acesso.tenant_administrador');
    }
}
