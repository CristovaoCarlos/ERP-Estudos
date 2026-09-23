<?php

namespace App\Rules;

use App\Support\Cnpj as CnpjSupport;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Cnpj implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! CnpjSupport::valido($value)) {
            $fail('Informe um CNPJ válido.');
        }
    }
}
