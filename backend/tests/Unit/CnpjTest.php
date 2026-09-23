<?php

namespace Tests\Unit;

use App\Support\Cnpj;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class CnpjTest extends TestCase
{
    /** @return array<string, array{string, bool}> */
    public static function cnpjs(): array
    {
        return [
            'numérico com máscara' => ['11.222.333/0001-81', true],
            'numérico sem máscara' => ['11222333000181', true],
            'alfanumérico (exemplo da Receita)' => ['12.ABC.345/01DE-35', true],
            'alfanumérico em minúsculas' => ['12abc34501de35', true],
            'dígito verificador errado' => ['11222333000182', false],
            'letra no dígito verificador' => ['12ABC34501DE3A', false],
            'todos os caracteres iguais' => ['00000000000000', false],
            'curto' => ['1122233300018', false],
            'vazio' => ['', false],
        ];
    }

    #[DataProvider('cnpjs')]
    public function test_valida_cnpj(string $cnpj, bool $valido): void
    {
        $this->assertSame($valido, Cnpj::valido($cnpj));
    }

    public function test_normaliza(): void
    {
        $this->assertSame('12ABC34501DE35', Cnpj::normalizar('12.abc.345/01de-35'));
    }

    public function test_gera_cnpj_valido(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $this->assertTrue(Cnpj::valido(Cnpj::gerar()));
        }
    }
}
