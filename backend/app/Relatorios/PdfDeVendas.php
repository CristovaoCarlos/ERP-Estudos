<?php

namespace App\Relatorios;

use App\Models\Venda;
use App\Relatorios\Pdf\Pdf;

/**
 * Monta o PDF de Relatórios › Vendas no período (cabeçalho, rodapé e corpo). Fica fora do controller
 * porque quem gera o arquivo é o job `App\Jobs\GerarPdfDeVendas`, no worker da fila.
 */
final class PdfDeVendas
{
    /**
     * @param  array<string, mixed>  $dados  Saída de `VendasNoPeriodo::dados()`.
     */
    public static function montar(array $dados, string $emissor): Pdf
    {
        $periodo = Formatar::data($dados['filtros']['inicio']).' a '.Formatar::data($dados['filtros']['fim']);
        $prefeitura = e(tenant('nome') ?? tenant('id'));
        $emissao = 'Emitido em '.Formatar::dataHora(now()).' por '.e($emissor);

        return Pdf::novo()
            ->titulo("Vendas no período {$periodo}")
            ->paisagem()
            ->cabecalho(<<<HTML
                <table width="100%" style="border-bottom: 0.5pt solid #999; font-size: 9pt; color: #333;"><tr>
                    <td><strong style="font-size: 11pt;">{$prefeitura}</strong><br>Relatório de vendas no período</td>
                    <td style="text-align: right;">Período: {$periodo}</td>
                </tr></table>
                HTML)
            ->rodape(<<<HTML
                <table width="100%" style="border-top: 0.5pt solid #999; font-size: 7.5pt; color: #666;"><tr>
                    <td>{$emissao}</td>
                    <td style="text-align: right;">Página {pagina} de {paginas}</td>
                </tr></table>
                HTML)
            ->view('relatorios.vendas-periodo', ['dados' => $dados, 'formas' => Venda::FORMAS_DE_PAGAMENTO]);
    }
}
