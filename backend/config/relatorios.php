<?php

use App\Relatorios\Pdf\MotorMpdf;

return [

    /*
    | Biblioteca que gera os PDFs por trás da fachada App\Relatorios\Pdf\Pdf (ADR-0020).
    | Trocar de biblioteca: escreva um adaptador de App\Relatorios\Pdf\MotorDePdf, registre-o em
    | `motores_pdf` e aponte RELATORIOS_MOTOR_PDF para ele.
    */
    'motor_pdf' => env('RELATORIOS_MOTOR_PDF', 'mpdf'),

    'motores_pdf' => [
        'mpdf' => MotorMpdf::class,
    ],

    /*
    | Fuso da data e hora de emissão impressas nos relatórios (a aplicação trabalha em UTC).
    */
    'fuso_horario' => env('RELATORIOS_FUSO_HORARIO', 'America/Sao_Paulo'),

];
