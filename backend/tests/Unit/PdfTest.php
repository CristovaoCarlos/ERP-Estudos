<?php

namespace Tests\Unit;

use App\Relatorios\Pdf\MotorDePdf;
use App\Relatorios\Pdf\MotorMpdf;
use App\Relatorios\Pdf\OpcoesDoPdf;
use App\Relatorios\Pdf\Pdf;
use InvalidArgumentException;
use Tests\Fakes\MotorFalso;
use Tests\TestCase;

/** A fachada de PDF (ADR-0020): o sistema fala com ela, e ela com o motor configurado. */
class PdfTest extends TestCase
{
    public function test_o_motor_padrao_e_o_mpdf(): void
    {
        $this->assertInstanceOf(MotorMpdf::class, app(MotorDePdf::class));
    }

    public function test_motor_desconhecido_na_configuracao_e_recusado(): void
    {
        config(['relatorios.motor_pdf' => 'outra']);

        $this->expectException(InvalidArgumentException::class);
        app(MotorDePdf::class);
    }

    public function test_a_fachada_monta_o_documento_e_entrega_ao_motor(): void
    {
        $motor = new MotorFalso;
        $this->app->instance(MotorDePdf::class, $motor);

        $pdf = Pdf::novo()
            ->titulo('Teste')
            ->paisagem()
            ->margens(10, 11, 12, 13)
            ->cabecalho('<b>Prefeitura</b>')
            ->rodape('Página {pagina} de {paginas}')
            ->html('<p>Primeira</p>')
            ->quebrarPagina()
            ->html('<p>Segunda</p>')
            ->conteudo();

        $this->assertSame('%PDF-falso', $pdf);
        $this->assertSame(
            "<p>Primeira</p>\n<div style=\"page-break-before: always\"></div>\n<p>Segunda</p>",
            $motor->html,
        );
        $this->assertEquals(new OpcoesDoPdf(
            titulo: 'Teste',
            orientacao: OpcoesDoPdf::PAISAGEM,
            margemSuperior: 10,
            margemInferior: 12,
            margemEsquerda: 13,
            margemDireita: 11,
            cabecalho: '<b>Prefeitura</b>',
            rodape: 'Página {pagina} de {paginas}',
        ), $motor->opcoes);
    }

    public function test_download_e_inline_respondem_com_o_pdf(): void
    {
        $this->app->instance(MotorDePdf::class, new MotorFalso);

        $download = Pdf::novo()->html('<p>x</p>')->download('relatorio.pdf');
        $this->assertSame('%PDF-falso', $download->getContent());
        $this->assertSame('application/pdf', $download->headers->get('Content-Type'));
        $this->assertSame('attachment; filename="relatorio.pdf"', $download->headers->get('Content-Disposition'));

        $inline = Pdf::novo()->html('<p>x</p>')->inline('relatorio.pdf');
        $this->assertSame('inline; filename="relatorio.pdf"', $inline->headers->get('Content-Disposition'));
    }

    public function test_cada_documento_comeca_vazio(): void
    {
        $motor = new MotorFalso;
        $this->app->instance(MotorDePdf::class, $motor);

        Pdf::novo()->titulo('Primeiro')->html('<p>um</p>')->conteudo();
        Pdf::novo()->html('<p>dois</p>')->conteudo();

        $this->assertSame('<p>dois</p>', $motor->html);
        $this->assertSame('', $motor->opcoes->titulo);
    }

    public function test_o_mpdf_gera_um_pdf_de_verdade_com_acentos_e_numeracao(): void
    {
        $pdf = (new MotorMpdf)->gerar(
            '<h1>Relatório de ações</h1><p>Município de São João</p>',
            new OpcoesDoPdf(titulo: 'Relatório', rodape: 'Página {pagina} de {paginas}'),
        );

        $this->assertStringStartsWith('%PDF-', $pdf);
        $this->assertGreaterThan(1000, strlen($pdf));
    }
}
