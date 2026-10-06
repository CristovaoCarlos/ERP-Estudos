<?php

namespace App\Relatorios\Pdf;

/**
 * Página e metadados do PDF, sem nada de uma biblioteca específica. Margens em milímetros.
 * Cabeçalho e rodapé são HTML e podem usar `{pagina}` e `{paginas}`.
 */
final readonly class OpcoesDoPdf
{
    public const RETRATO = 'retrato';

    public const PAISAGEM = 'paisagem';

    public function __construct(
        public string $titulo = '',
        public string $orientacao = self::RETRATO,
        public int $margemSuperior = 25,
        public int $margemInferior = 18,
        public int $margemEsquerda = 12,
        public int $margemDireita = 12,
        public string $cabecalho = '',
        public string $rodape = '',
    ) {}

    /** Cópia com os campos informados trocados. */
    public function com(mixed ...$campos): self
    {
        return new self(...array_replace(get_object_vars($this), $campos));
    }
}
