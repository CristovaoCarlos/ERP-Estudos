<?php

namespace App\Support;

class Cpf
{
    /** Remove a máscara: "123.456.789-09" → "12345678909". */
    public static function digitos(string $cpf): string
    {
        return preg_replace('/\D/', '', $cpf) ?? '';
    }

    /** Confere o tamanho e os dígitos verificadores (aceita com ou sem máscara). */
    public static function valido(string $cpf): bool
    {
        $cpf = self::digitos($cpf);

        if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false;
        }

        foreach ([9, 10] as $posicao) {
            if ((int) $cpf[$posicao] !== self::digitoVerificador(substr($cpf, 0, $posicao))) {
                return false;
            }
        }

        return true;
    }

    /** CPF válido aleatório, só dígitos (para factories e testes). */
    public static function gerar(): string
    {
        do {
            $base = '';
            for ($i = 0; $i < 9; $i++) {
                $base .= random_int(0, 9);
            }
            $base .= self::digitoVerificador($base);
            $cpf = $base.self::digitoVerificador($base);
        } while (! self::valido($cpf));

        return $cpf;
    }

    private static function digitoVerificador(string $digitos): int
    {
        $peso = strlen($digitos) + 1;
        $soma = 0;
        foreach (str_split($digitos) as $digito) {
            $soma += (int) $digito * $peso--;
        }
        $resto = $soma % 11;

        return $resto < 2 ? 0 : 11 - $resto;
    }
}
