<?php

namespace Tests\Unit;

use App\Support\Cpf;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class CpfTest extends TestCase
{
    /** @return array<string, array{string, bool}> */
    public static function cpfs(): array
    {
        return [
            'válido com máscara' => ['529.982.247-25', true],
            'válido sem máscara' => ['52998224725', true],
            'dígito verificador errado' => ['52998224726', false],
            'todos os dígitos iguais' => ['111.111.111-11', false],
            'curto' => ['5299822472', false],
            'vazio' => ['', false],
        ];
    }

    #[DataProvider('cpfs')]
    public function test_valida_cpf(string $cpf, bool $valido): void
    {
        $this->assertSame($valido, Cpf::valido($cpf));
    }

    public function test_remove_a_mascara(): void
    {
        $this->assertSame('52998224725', Cpf::digitos('529.982.247-25'));
    }

    public function test_gera_cpf_valido(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $this->assertTrue(Cpf::valido(Cpf::gerar()));
        }
    }
}
