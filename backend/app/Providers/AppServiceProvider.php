<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use App\Support\Cpf;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
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

        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)->by(
            Cpf::digitos((string) $request->input('cpf')).'|'.$request->ip()
        ));
    }
}
