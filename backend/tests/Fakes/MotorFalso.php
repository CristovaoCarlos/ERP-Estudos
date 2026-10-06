<?php

namespace Tests\Fakes;

use App\Relatorios\Pdf\MotorDePdf;
use App\Relatorios\Pdf\OpcoesDoPdf;

/** Motor de PDF dos testes: guarda o que recebeu e devolve um PDF de mentira. */
final class MotorFalso implements MotorDePdf
{
    public ?string $html = null;

    public ?OpcoesDoPdf $opcoes = null;

    public function gerar(string $html, OpcoesDoPdf $opcoes): string
    {
        $this->html = $html;
        $this->opcoes = $opcoes;

        return '%PDF-falso';
    }
}
