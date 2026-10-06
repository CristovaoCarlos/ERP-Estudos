<?php

namespace App\Relatorios\Pdf;

/**
 * Contrato de uma biblioteca de PDF. Cada biblioteca tem um adaptador que o cumpre (hoje,
 * `MotorMpdf`); o sistema usa só a fachada `Pdf`. Trocar de biblioteca é escrever outro adaptador
 * e apontar `config/relatorios.php` para ele (ADR-0020).
 */
interface MotorDePdf
{
    /**
     * Converte o HTML do documento em PDF. Cabeçalho e rodapé de `$opcoes` repetem em todas as
     * páginas, com `{pagina}` e `{paginas}` trocados pelos números.
     *
     * @return string Os bytes do PDF.
     */
    public function gerar(string $html, OpcoesDoPdf $opcoes): string;
}
