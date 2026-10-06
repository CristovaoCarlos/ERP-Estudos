<?php

namespace App\Rules;

use App\Support\Gtin as GtinSupport;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Gtin implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! GtinSupport::valido($value)) {
            $fail('Código de barras inválido: confira os dígitos (EAN de 8, 12, 13 ou 14 números).');
        }
    }
}
