<?php

/*
 * Acesso às telas do sistema: grupos (papéis do spatie) e permissões, gravados no banco de
 * cada prefeitura por `acesso:sincronizar` e no provisionamento.
 *
 * Cada tela do menu (`frontend/src/lib/navegacao.ts`) tem uma permissão com o nome da URL,
 * sem a barra inicial e com `.` no lugar de `/`: `/parametros/receitas` → `parametros.receitas`.
 * Tela nova no menu: adicione a permissão aqui.
 */

return [

    /*
     * Prefeitura (tenant) administradora. Só entrando por ela o superadmin tem acesso total
     * e o cadastro de empresas.
     */
    'tenant_administrador' => env('TENANT_ADMINISTRADOR', 'demo'),

    /*
     * Grupos de acesso criados em toda prefeitura: nome do grupo => módulo do menu.
     * O grupo recebe todas as permissões do módulo.
     */
    'grupos' => [
        // 'Administrador' é criado sempre, com todas as telas (ver App\Support\Acesso).
        'cadastros' => 'cadastros',
        'Lançamentos' => 'lancamentos',
    ],

    /* Permissões por módulo do menu. */
    'permissoes' => [
        'cadastros' => [
            'cadastros.clientes',
            'cadastros.produtos',
            'cadastros.vendedores',
        ],
        'lancamentos' => [
            'lancamentos.vendas',
        ],
        'relatorios' => [
            'relatorios.vendas_periodo',
        ],
        'administracao' => [
            'administracao.usuarios',
            'administracao.grupos',
        ],
    ],

    /*
     * Telas exclusivas do superadmin (na prefeitura TENANT_ADMINISTRADOR), além de Empresas.
     * Ficam fora do catálogo acima: nenhum grupo as recebe, nem o Administrador das prefeituras.
     * Tabelas Comuns gravam no banco central, e o que se muda nelas vale para todas as prefeituras.
     */
    'superadmin' => [
        'administracao.tabelas-comuns.cidades',
        'administracao.tabelas-comuns.unidades',
    ],

];
