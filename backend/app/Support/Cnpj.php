<?php

namespace App\Support;

/**
 * CNPJ numérico ou alfanumérico (IN RFB 2.229/2024, em vigor desde julho de 2026): as 12 primeiras
 * posições aceitam letras e números; os 2 dígitos verificadores são sempre números.
 */
class Cnpj
{
    /** Remove a máscara e passa para maiúsculas: "12.abc.345/01de-35" → "12ABC34501DE35". */
    public static function normalizar(string $cnpj): string
    {
        return strtoupper(preg_replace('/[^0-9A-Za-z]/', '', $cnpj) ?? '');
    }

    /** Confere o formato e os dígitos verificadores (aceita com ou sem máscara). */
    public static function valido(string $cnpj): bool
    {
        $cnpj = self::normalizar($cnpj);

        if (! preg_match('/^[0-9A-Z]{12}\d{2}$/', $cnpj) || preg_match('/^(.)\1{13}$/', $cnpj)) {
            return false;
        }

        return substr($cnpj, 12) === self::digitosVerificadores(substr($cnpj, 0, 12));
    }

    /** CNPJ numérico válido aleatório, sem máscara (para factories e testes). */
    public static function gerar(): string
    {
        do {
            $base = '';
            for ($i = 0; $i < 12; $i++) {
                $base .= random_int(0, 9);
            }
            $cnpj = $base.self::digitosVerificadores($base);
        } while (! self::valido($cnpj));

        return $cnpj;
    }

    private static function digitosVerificadores(string $base): string
    {
        $primeiro = self::digitoVerificador($base);

        return $primeiro.self::digitoVerificador($base.$primeiro);
    }

    /** Módulo 11 com pesos de 2 a 9 da direita para a esquerda; cada caractere vale seu ASCII − 48. */
    private static function digitoVerificador(string $caracteres): int
    {
        $soma = 0;
        $peso = 2;
        foreach (array_reverse(str_split($caracteres)) as $caractere) {
            $soma += (ord($caractere) - 48) * $peso;
            $peso = $peso === 9 ? 2 : $peso + 1;
        }
        $resto = $soma % 11;

        return $resto < 2 ? 0 : 11 - $resto;
    }
}
