<?php

namespace App\Relatorios;

use Carbon\CarbonInterface;

/** Formatação pt-BR para os relatórios (views Blade dos PDFs). */
final class Formatar
{
    /** "1234.5" → "R$ 1.234,50". */
    public static function moeda(string|int|float|null $valor): string
    {
        return 'R$ '.number_format((float) $valor, 2, ',', '.');
    }

    /** "3.50" → "3,5%". */
    public static function percentual(string|int|float|null $valor): string
    {
        return rtrim(rtrim(number_format((float) $valor, 2, ',', '.'), '0'), ',').'%';
    }

    /** "2026-10-06" → "06/10/2026". */
    public static function data(string $data): string
    {
        [$ano, $mes, $dia] = explode('-', $data);

        return "{$dia}/{$mes}/{$ano}";
    }

    /** Data e hora no fuso dos relatórios: "06/10/2026 14:35". */
    public static function dataHora(CarbonInterface $momento): string
    {
        return $momento->copy()->setTimezone(config('relatorios.fuso_horario'))->format('d/m/Y H:i');
    }

    /** CPF (11) ou CNPJ (14, pode ter letras) com a máscara. */
    public static function documento(string $documento): string
    {
        return match (strlen($documento)) {
            11 => preg_replace('/^(\d{3})(\d{3})(\d{3})(\d{2})$/', '$1.$2.$3-$4', $documento),
            14 => preg_replace('/^(\w{2})(\w{3})(\w{3})(\w{4})(\w{2})$/', '$1.$2.$3/$4-$5', $documento),
            default => $documento,
        };
    }
}
