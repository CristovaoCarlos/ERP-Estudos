<?php

namespace Database\Factories;

use App\Models\Produto;
use App\Support\Gtin;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Produto de exemplo, com estoque controlado e acima do mínimo.
 *
 * @extends Factory<Produto>
 */
class ProdutoFactory extends Factory
{
    protected $model = Produto::class;

    /** Categoria => itens, para descrições com cara de produto de verdade. */
    private const CATALOGO = [
        'Alimentos' => ['Arroz tipo 1 5 kg', 'Feijão carioca 1 kg', 'Café torrado 500 g', 'Açúcar cristal 2 kg', 'Óleo de soja 900 ml'],
        'Bebidas' => ['Água mineral 500 ml', 'Refrigerante 2 L', 'Suco de uva integral 1 L', 'Cerveja lata 350 ml'],
        'Limpeza' => ['Detergente 500 ml', 'Sabão em pó 1 kg', 'Desinfetante 2 L', 'Esponja dupla face'],
        'Papelaria' => ['Caderno 96 folhas', 'Caneta esferográfica azul', 'Papel A4 500 folhas', 'Grampeador'],
        'Ferramentas' => ['Martelo unha 27 mm', 'Chave de fenda 1/4', 'Trena 5 m', 'Alicate universal 8"'],
    ];

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categoria = fake()->randomElement(array_keys(self::CATALOGO));
        $custo = fake()->randomFloat(2, 2, 300);

        return [
            'codigo' => strtoupper(substr($categoria, 0, 3)).'-'.fake()->unique()->numerify('####'),
            'descricao' => fake()->randomElement(self::CATALOGO[$categoria]),
            'codigo_barras' => Gtin::gerar(),
            'unidade' => fake()->randomElement(['UN', 'UN', 'UN', 'CX', 'PC', 'KG']),
            'categoria' => $categoria,
            'preco_custo' => $custo,
            'preco_venda' => round($custo * fake()->randomFloat(2, 1.2, 2.2), 2),
            'controla_estoque' => true,
            'estoque_atual' => fake()->numberBetween(20, 500),
            'estoque_minimo' => fake()->numberBetween(5, 15),
            'ncm' => fake()->numerify('########'),
            'cest' => null,
            'origem' => 0,
            'peso_bruto' => fake()->randomFloat(3, 0.1, 6),
            'peso_liquido' => null,
            'observacoes' => null,
            'ativo' => true,
        ];
    }

    /** Estoque no mínimo ou abaixo dele. */
    public function estoqueBaixo(): static
    {
        return $this->state(fn () => ['estoque_atual' => fake()->numberBetween(0, 4), 'estoque_minimo' => 5]);
    }

    /** Sem controle de estoque (serviço, item sob encomenda). */
    public function semEstoque(): static
    {
        return $this->state(fn () => [
            'controla_estoque' => false,
            'estoque_atual' => 0,
            'estoque_minimo' => null,
            'codigo_barras' => null,
        ]);
    }

    public function inativo(): static
    {
        return $this->state(fn () => ['ativo' => false]);
    }
}
