<?php

namespace App\Relatorios\Pdf;

use Illuminate\Http\Response;

/**
 * Fachada de PDF do sistema: monta o documento (HTML ou view Blade, cabeçalho, rodapé, página) e
 * pede o PDF ao `MotorDePdf` configurado. Relatórios e documentos usam só esta classe, nunca a
 * biblioteca: trocar de biblioteca não muda nenhum deles (ADR-0020).
 *
 *     return Pdf::novo()
 *         ->titulo('Vendas no período')
 *         ->paisagem()
 *         ->rodape('Página {pagina} de {paginas}')
 *         ->view('relatorios.vendas-periodo', $dados)
 *         ->download('vendas.pdf');
 */
final class Pdf
{
    private OpcoesDoPdf $opcoes;

    /** @var list<string> */
    private array $partes = [];

    public function __construct(private readonly MotorDePdf $motor)
    {
        $this->opcoes = new OpcoesDoPdf;
    }

    /** Documento novo, com o motor de `config/relatorios.php`. */
    public static function novo(): self
    {
        return app(self::class);
    }

    public function titulo(string $titulo): self
    {
        $this->opcoes = $this->opcoes->com(titulo: $titulo);

        return $this;
    }

    public function paisagem(): self
    {
        $this->opcoes = $this->opcoes->com(orientacao: OpcoesDoPdf::PAISAGEM);

        return $this;
    }

    public function retrato(): self
    {
        $this->opcoes = $this->opcoes->com(orientacao: OpcoesDoPdf::RETRATO);

        return $this;
    }

    /** Margens em milímetros. */
    public function margens(int $superior, int $direita, int $inferior, int $esquerda): self
    {
        $this->opcoes = $this->opcoes->com(
            margemSuperior: $superior,
            margemDireita: $direita,
            margemInferior: $inferior,
            margemEsquerda: $esquerda,
        );

        return $this;
    }

    /** HTML repetido no topo de cada página; aceita `{pagina}` e `{paginas}`. */
    public function cabecalho(string $html): self
    {
        $this->opcoes = $this->opcoes->com(cabecalho: $html);

        return $this;
    }

    /** HTML repetido no pé de cada página; aceita `{pagina}` e `{paginas}`. */
    public function rodape(string $html): self
    {
        $this->opcoes = $this->opcoes->com(rodape: $html);

        return $this;
    }

    /** Acrescenta HTML ao corpo do documento. */
    public function html(string $html): self
    {
        $this->partes[] = $html;

        return $this;
    }

    /**
     * Acrescenta uma view Blade ao corpo.
     *
     * @param  array<string, mixed>  $dados
     */
    public function view(string $view, array $dados = []): self
    {
        return $this->html(view($view, $dados)->render());
    }

    /** Começa uma página nova (CSS padrão, que todo motor de HTML entende). */
    public function quebrarPagina(): self
    {
        return $this->html('<div style="page-break-before: always"></div>');
    }

    /** Os bytes do PDF. */
    public function conteudo(): string
    {
        return $this->motor->gerar(implode("\n", $this->partes), $this->opcoes);
    }

    /** Resposta que baixa o PDF com o nome informado. */
    public function download(string $arquivo): Response
    {
        return $this->resposta($arquivo, 'attachment');
    }

    /** Resposta que abre o PDF no navegador. */
    public function inline(string $arquivo): Response
    {
        return $this->resposta($arquivo, 'inline');
    }

    private function resposta(string $arquivo, string $disposicao): Response
    {
        return response($this->conteudo(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => sprintf('%s; filename="%s"', $disposicao, $arquivo),
        ]);
    }
}
