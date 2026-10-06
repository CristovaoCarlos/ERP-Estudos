<?php

namespace Database\Factories;

use App\Models\Vendedor;
use App\Support\Cpf;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Vendedor de exemplo, ativo.
 *
 * @extends Factory<Vendedor>
 */
class VendedorFactory extends Factory
{
    protected $model = Vendedor::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $ddd = (string) fake()->numberBetween(11, 99);

        return [
            'nome' => fake()->name(),
            'cpf' => Cpf::gerar(),
            'data_admissao' => fake()->dateTimeBetween('-8 years', '-1 month')->format('Y-m-d'),
            'email' => fake()->unique()->safeEmail(),
            'celular' => $ddd.fake()->numerify('9########'),
            'telefone' => fake()->optional(0.3)->numerify($ddd.'3#######'),
            'comissao_percentual' => fake()->randomElement([2, 2.5, 3, 4, 5]),
            'meta_mensal' => fake()->optional(0.8)->randomElement([20000, 30000, 50000, 80000]),
            'regiao' => fake()->randomElement(['Centro', 'Zona Norte', 'Zona Sul', 'Interior', 'Capital']),
            'observacoes' => null,
            'ativo' => true,
        ];
    }

    public function inativo(): static
    {
        return $this->state(fn () => ['ativo' => false]);
    }
}
