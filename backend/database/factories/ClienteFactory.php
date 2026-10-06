<?php

namespace Database\Factories;

use App\Models\Cidade;
use App\Models\Cliente;
use App\Support\Cnpj;
use App\Support\Cpf;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Cliente de exemplo, pessoa física por padrão. Documentos válidos; a cidade é sorteada entre as
 * do banco central (fica vazia se `tc_cidade` não tiver nenhuma).
 *
 * @extends Factory<Cliente>
 */
class ClienteFactory extends Factory
{
    protected $model = Cliente::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $ddd = (string) fake()->numberBetween(11, 99);

        return [
            'tipo_pessoa' => 'F',
            'cpf_cnpj' => Cpf::gerar(),
            'nome' => fake()->name(),
            'nome_fantasia' => null,
            'rg' => fake()->numerify('#########'),
            'data_nascimento' => fake()->dateTimeBetween('-80 years', '-18 years')->format('Y-m-d'),
            'cep' => fake()->numerify('########'),
            'logradouro' => fake()->streetName(),
            'numero' => (string) fake()->buildingNumber(),
            'complemento' => fake()->optional(0.3)->randomElement(['Casa', 'Apto 101', 'Sala 3', 'Fundos']),
            'bairro' => fake()->randomElement(['Centro', 'Jardim América', 'Vila Nova', 'Boa Vista', 'São José']),
            'id_cidade' => fn () => Cidade::inRandomOrder()->value('id_cidade'),
            'email' => fake()->unique()->safeEmail(),
            'telefone' => fake()->optional(0.5)->numerify($ddd.'3#######'),
            'celular' => $ddd.fake()->numerify('9########'),
            'indicador_ie' => 9,
            'inscricao_estadual' => null,
            'inscricao_municipal' => null,
            'consumidor_final' => true,
            'limite_credito' => fake()->optional(0.6)->randomFloat(2, 500, 20000),
            'observacoes' => fake()->optional(0.2)->sentence(),
            'ativo' => true,
        ];
    }

    /** Pessoa jurídica contribuinte do ICMS, com IE e IM. */
    public function juridica(): static
    {
        return $this->state(fn () => [
            'tipo_pessoa' => 'J',
            'cpf_cnpj' => Cnpj::gerar(),
            'nome' => fake()->company(),
            'nome_fantasia' => fake()->company(),
            'rg' => null,
            'data_nascimento' => null,
            'indicador_ie' => 1,
            'inscricao_estadual' => fake()->numerify('###.###.###.###'),
            'inscricao_municipal' => fake()->numerify('######'),
            'consumidor_final' => false,
            'limite_credito' => fake()->randomFloat(2, 5000, 100000),
        ]);
    }

    public function inativo(): static
    {
        return $this->state(fn () => ['ativo' => false]);
    }
}
