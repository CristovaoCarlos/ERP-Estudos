<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\FotoController;
use App\Http\Controllers\GrupoController;
use App\Http\Controllers\SenhaController;
use App\Http\Controllers\UsuarioController;
use App\Http\Middleware\EnsureUserBelongsToTenant;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

Route::middleware([
    'api',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->prefix('api')->group(function () {
    Route::get('/tenant', fn () => ['id' => tenant('id'), 'nome' => tenant('nome')]);

    Route::get('/fotos/{arquivo}', [FotoController::class, 'mostrar']);

    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

    // Recuperação de senha por e-mail.
    Route::post('/senha/esqueci', [SenhaController::class, 'esqueci'])->middleware('throttle:senha');
    Route::post('/senha/redefinir', [SenhaController::class, 'redefinir'])->middleware('throttle:senha');

    Route::middleware(['auth:sanctum', EnsureUserBelongsToTenant::class])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/me', [AuthController::class, 'atualizar']);
        Route::put('/me/senha', [AuthController::class, 'alterarSenha']);
        Route::post('/me/foto', [FotoController::class, 'enviar']);
        Route::delete('/me/foto', [FotoController::class, 'remover']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // Administração › Usuários (permissão da tela).
        Route::middleware('can:administracao.usuarios')->group(function () {
            Route::get('/usuarios', [UsuarioController::class, 'index']);
            Route::post('/usuarios', [UsuarioController::class, 'store']);
            Route::put('/usuarios/{usuario}', [UsuarioController::class, 'update']);
            Route::put('/usuarios/{usuario}/vinculos', [UsuarioController::class, 'vinculos']);
            Route::put('/usuarios/{usuario}/status', [UsuarioController::class, 'status']);
            Route::delete('/usuarios/{usuario}', [UsuarioController::class, 'destroy']);
        });

        // Administração › Grupos de acesso. A lista também serve ao formulário de usuários.
        Route::middleware('can:administracao.grupos')->group(function () {
            Route::post('/grupos', [GrupoController::class, 'store']);
            Route::put('/grupos/{grupo}', [GrupoController::class, 'update']);
            Route::delete('/grupos/{grupo}', [GrupoController::class, 'destroy']);
        });
        // A lista serve às duas telas: a permissão é conferida no controller.
        Route::get('/grupos', [GrupoController::class, 'index']);

        // Só o superadmin, na prefeitura da Lemarq.
        Route::middleware('can:gerenciar-empresas')->group(function () {
            Route::get('/empresas', [EmpresaController::class, 'index']);
            Route::post('/empresas', [EmpresaController::class, 'store']);
        });
    });
});
