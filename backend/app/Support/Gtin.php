<?php

namespace App\Support;

/**
 * Código de barras GTIN (EAN-8, UPC-12, EAN-13, GTIN-14): só dígitos, com o último sendo o dígito
 * verificador (módulo 10, pesos 3 e 1 alternados da direita para a esquerda).
 */
class Gtin
{
    /** Remove a máscara (espaços, pontos e hífens): "789 1000 31550-7" → "7891000315507". */
    public static function normalizar(string $gtin): string
    {
        return preg_replace('/[\s.-]/', '', $gtin) ?? '';
    }

    /** Confere o tamanho (8, 12, 13 ou 14) e o dígito verificador. */
    public static function valido(string $gtin): bool
    {
        $gtin = self::normalizar($gtin);
        if (! preg_match('/^(\d{8}|\d{12,14})$/', $gtin)) {
            return false;
        }

        return (int) substr($gtin, -1) === self::digitoVerificador(substr($gtin, 0, -1));
    }

    /** GTIN-13 válido aleatório com o prefixo do Brasil (789), para factories e testes. */
    public static function gerar(): string
    {
        $base = '789'.str_pad((string) random_int(0, 999_999_999), 9, '0', STR_PAD_LEFT);

        return $base.self::digitoVerificador($base);
    }

    private static function digitoVerificador(string $base): int
    {
        $soma = 0;
        foreach (array_reverse(str_split($base)) as $posicao => $digito) {
            $soma += (int) $digito * ($posicao % 2 === 0 ? 3 : 1);
        }

        return (10 - $soma % 10) % 10;
    }
}
