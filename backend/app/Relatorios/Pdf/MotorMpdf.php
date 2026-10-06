<?php

namespace App\Relatorios\Pdf;

use Mpdf\Mpdf;

/**
 * Adaptador do mPDF (`mpdf/mpdf`), a biblioteca adotada. É o único lugar do sistema que conhece o
 * mPDF: HTML e CSS entram, os bytes do PDF saem.
 */
final class MotorMpdf implements MotorDePdf
{
    public function gerar(string $html, OpcoesDoPdf $opcoes): string
    {
        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => $opcoes->orientacao === OpcoesDoPdf::PAISAGEM ? 'A4-L' : 'A4',
            'default_font' => 'dejavusans',
            'margin_top' => $opcoes->margemSuperior,
            'margin_bottom' => $opcoes->margemInferior,
            'margin_left' => $opcoes->margemEsquerda,
            'margin_right' => $opcoes->margemDireita,
            'margin_header' => 6,
            'margin_footer' => 6,
            // O storage_path tem sufixo por prefeitura (config/tenancy.php): a pasta de lá pode
            // não existir. A pasta temporária do sistema serve a todas.
            'tempDir' => sys_get_temp_dir().'/mpdf',
        ]);

        $mpdf->SetTitle($opcoes->titulo);
        $mpdf->SetCreator(config('app.name'));
        if ($opcoes->cabecalho !== '') {
            $mpdf->SetHTMLHeader(self::numeracao($opcoes->cabecalho));
        }
        if ($opcoes->rodape !== '') {
            $mpdf->SetHTMLFooter(self::numeracao($opcoes->rodape));
        }
        $mpdf->WriteHTML($html);

        return $mpdf->Output('', 'S');
    }

    /** `{pagina}` e `{paginas}` da fachada nos marcadores do mPDF. */
    private static function numeracao(string $html): string
    {
        return strtr($html, ['{pagina}' => '{PAGENO}', '{paginas}' => '{nbpg}']);
    }
}
