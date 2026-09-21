<?php

use Illuminate\Support\Facades\Route;

foreach (config('tenancy.central_domains') as $domain) {
    Route::domain($domain)->group(function () {
        Route::get('/status', fn () => ['app' => config('app.name'), 'status' => 'ok']);
    });
}
