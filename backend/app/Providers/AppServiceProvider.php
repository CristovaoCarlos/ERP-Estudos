<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use App\Models\User;
use App\Support\Cpf;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        // Token sem uso há mais que o prazo de inatividade é recusado e apagado. O Sanctum chama
        // este callback antes de gravar o novo last_used_at, então ele enxerga o uso anterior.
        Sanctum::authenticateAccessTokensUsing(function (PersonalAccessToken $token, bool $valido) {
            $limite = now()->subMinutes(config('sessao.inatividade_minutos'));

            if ($valido && ($token->last_used_at ?? $token->created_at)->lt($limite)) {
                $token->delete();

                return false;
            }

            return $valido;
        });

        // Superadmin, na prefeitura administradora, pode tudo; os demais dependem dos grupos de acesso.
        Gate::before(fn (User $user) => $user->ehSuperadmin() ? true : null);
        Gate::define('gerenciar-empresas', fn (User $user) => $user->ehSuperadmin());
        // Tabelas Comuns gravam no banco central (valem para todas as prefeituras): só o superadmin.
        Gate::define('gerenciar-tabelas-comuns', fn (User $user) => $user->ehSuperadmin());

        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)->by(
            Cpf::digitos((string) $request->input('cpf')).'|'.$request->ip()
        ));

        RateLimiter::for('senha', fn (Request $request) => Limit::perMinute(5)->by(
            'senha|'.Cpf::digitos((string) $request->input('cpf')).'|'.$request->ip()
        ));
    }
}
