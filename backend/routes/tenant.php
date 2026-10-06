<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CidadeController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\FotoController;
use App\Http\Controllers\GrupoController;
use App\Http\Controllers\ProdutoController;
use App\Http\Controllers\RelatorioDeVendasController;
use App\Http\Controllers\SenhaController;
use App\Http\Controllers\UnidadeController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\VendaController;
use App\Http\Controllers\VendedorController;
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
        Route::post('/sessao/renovar', [AuthController::class, 'renovar']);
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

        // Cadastros › Clientes. A rota `cidades` vem antes de `{cliente}`.
        Route::middleware('can:cadastros.clientes')->prefix('cadastros/clientes')->group(function () {
            Route::get('/', [ClienteController::class, 'index']);
            Route::post('/', [ClienteController::class, 'store']);
            Route::get('/cidades', [ClienteController::class, 'cidades']);
            Route::put('/{cliente}', [ClienteController::class, 'update']);
            Route::delete('/{cliente}', [ClienteController::class, 'destroy']);
        });

        // Cadastros › Produtos. A rota `opcoes` vem antes de `{produto}`.
        Route::middleware('can:cadastros.produtos')->prefix('cadastros/produtos')->group(function () {
            Route::get('/', [ProdutoController::class, 'index']);
            Route::post('/', [ProdutoController::class, 'store']);
            Route::get('/opcoes', [ProdutoController::class, 'opcoes']);
            Route::put('/{produto}', [ProdutoController::class, 'update']);
            Route::delete('/{produto}', [ProdutoController::class, 'destroy']);
        });

        // Cadastros › Vendedores. A rota `regioes` vem antes de `{vendedor}`.
        Route::middleware('can:cadastros.vendedores')->prefix('cadastros/vendedores')->group(function () {
            Route::get('/', [VendedorController::class, 'index']);
            Route::post('/', [VendedorController::class, 'store']);
            Route::get('/regioes', [VendedorController::class, 'regioes']);
            Route::put('/{vendedor}', [VendedorController::class, 'update']);
            Route::delete('/{vendedor}', [VendedorController::class, 'destroy']);
        });

        // Lançamentos › Vendas. A venda não se altera nem se exclui: só se cancela, e o estoque volta.
        Route::middleware('can:lancamentos.vendas')->prefix('lancamentos/vendas')->group(function () {
            Route::get('/', [VendaController::class, 'index']);
            Route::post('/', [VendaController::class, 'store']);
            Route::get('/opcoes', [VendaController::class, 'opcoes']);
            Route::post('/{venda}/cancelar', [VendaController::class, 'cancelar']);
        });

        // Relatórios › Vendas no período: prévia (JSON), PDF e as listas dos filtros.
        Route::middleware('can:relatorios.vendas_periodo')->prefix('relatorios/vendas-periodo')->group(function () {
            Route::get('/', [RelatorioDeVendasController::class, 'index']);
            Route::get('/pdf', [RelatorioDeVendasController::class, 'pdf']);
            Route::get('/opcoes', [RelatorioDeVendasController::class, 'opcoes']);
        });

        // Tabelas Comuns: gravam no banco central (valem para todas as prefeituras), então só o
        // superadmin, na prefeitura administradora.
        Route::middleware('can:gerenciar-tabelas-comuns')->prefix('administracao/tabelas-comuns')->group(function () {
            Route::get('/cidades', [CidadeController::class, 'index']);
            Route::post('/cidades', [CidadeController::class, 'store']);
            Route::put('/cidades/{cidade}', [CidadeController::class, 'update']);
            Route::get('/unidades', [UnidadeController::class, 'index']);
            Route::post('/unidades', [UnidadeController::class, 'store']);
            Route::put('/unidades/{unidade}', [UnidadeController::class, 'update']);
        });

        // Só o superadmin, na prefeitura administradora.
        Route::middleware('can:gerenciar-empresas')->group(function () {
            Route::get('/empresas', [EmpresaController::class, 'index']);
            Route::post('/empresas', [EmpresaController::class, 'store']);
        });
    });
});
