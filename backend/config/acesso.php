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
     * Prefeitura (tenant) da Lemarq. Só entrando por ela o superadmin tem acesso total
     * e o cadastro de empresas.
     */
    'tenant_administrador' => env('TENANT_ADMINISTRADOR', 'lemarq'),

    /*
     * Grupos de acesso criados em toda prefeitura: nome do grupo => módulo do menu.
     * O grupo recebe todas as permissões do módulo.
     */
    'grupos' => [
        // 'Administrador' é criado sempre, com todas as telas (ver App\Support\Acesso).
        'Parâmetros' => 'parametros',
        'Tabelas' => 'tabelas',
        'Lançamentos' => 'lancamentos',
    ],

    /* Permissões por módulo do menu. */
    'permissoes' => [
        'parametros' => [
            'parametros.receitas',
            'parametros.nota-fiscal',
            'parametros.alvara',
            'parametros.itbi',
            'parametros.iptu',
            'parametros.habite-se',
            'parametros.certidao-negativa',
            'parametros.juros-e-multa',
            'parametros.base-legal',
        ],
        'tabelas' => [
            'tabelas.receitas-tributarias',
            'tabelas.convenios',
            'tabelas.servicos',
            'tabelas.irpj',
            'tabelas.irpf',
            'tabelas.ufm',
            'tabelas.inss',
            'tabelas.cadastro-economico',
            'tabelas.tomadores.tomador',
            'tabelas.tomadores.estrangeiro',
            'tabelas.tipos-de-alvara',
            'tabelas.natureza-itbi',
            'tabelas.fatores-de-localizacao',
            'tabelas.isencoes',
            'tabelas.cartorios',
            'tabelas.modelos-certidao-negativa',
            'tabelas.modelos-historico-nota-fiscal',
        ],
        'lancamentos' => [
            'lancamentos.documentos-avulsos',
            'lancamentos.nota-fiscal',
            'lancamentos.alvara',
            'lancamentos.imoveis.urbanos',
            'lancamentos.imoveis.imoveis',
            'lancamentos.imoveis.rurais',
            'lancamentos.itbi',
            'lancamentos.habite-se',
            'lancamentos.iptu',
            'lancamentos.dam.consultas',
            'lancamentos.dam.iptu',
            'lancamentos.dam.arquivo-retorno',
            'lancamentos.certidao-negativa',
        ],
        'relatorios' => [
            'relatorios.rendimentos',
            'relatorios.receitas-apuradas',
            'relatorios.iss',
            'relatorios.inss',
            'relatorios.irpf',
            'relatorios.notas-fiscais.emitidas',
            'relatorios.notas-fiscais.por-servico',
            'relatorios.notas-fiscais.por-prestador',
            'relatorios.notas-fiscais.por-tomador',
            'relatorios.notas-fiscais.por-valor',
            'relatorios.notas-fiscais.canceladas',
            'relatorios.alvaras.listagem',
            'relatorios.alvaras.cnpj-sem-alvara',
            'relatorios.imoveis',
            'relatorios.itbi',
            'relatorios.habite-se',
            'relatorios.dams',
            'relatorios.contribuintes.lancamentos',
            'relatorios.contribuintes.relacao',
            'relatorios.contribuintes.cadastro-economico',
            'relatorios.contribuintes.inscricao-municipal',
        ],
        'administracao' => [
            'administracao.usuarios',
            'administracao.grupos',
            'administracao.tabelas-internas.cidades',
            'administracao.tabelas-internas.bancos',
            'administracao.tabelas-internas.cnae',
            'administracao.tabelas-internas.lista-de-servicos',
            'administracao.tabelas-internas.selic',
            'administracao.tabelas-internas.segmentos',
            'administracao.tabelas-internas.numeracao-de-notas',
            'administracao.tabelas-internas.tipos-de-dam',
        ],
    ],

];
