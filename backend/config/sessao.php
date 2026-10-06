<?php

return [

    /*
    | Minutos sem uso até o token da sessão expirar. O frontend recebe o valor
    | em /login e /me e desloga sozinho; o backend recusa o token ocioso (ADR-0017).
    */
    'inatividade_minutos' => (int) env('SESSAO_INATIVIDADE_MINUTOS', 5),

];
