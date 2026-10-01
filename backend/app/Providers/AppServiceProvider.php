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
