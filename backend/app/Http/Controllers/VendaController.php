<?php

namespace App\Http\Controllers;

use App\Http\Resources\VendaResource;
use App\Models\Cliente;
use App\Models\Produto;
use App\Models\Venda;
use App\Models\Vendedor;
use App\Support\Vendas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Lançamentos › Vendas: lista, registra e cancela as vendas da prefeitura. Registrar dá baixa no
 * estoque e cancelar devolve (`App\Support\Vendas`); a venda registrada não se altera.
 */
class VendaController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return VendaResource::collection(
            Venda::with(['cliente', 'vendedor', 'itens'])
                ->orderByDesc('data_venda')
                ->orderByDesc('id_venda')
                ->get(),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $venda = Vendas::registrar($this->validar($request));

        return (new VendaResource($venda->refresh()->load(['cliente', 'vendedor', 'itens'])))
            ->response()
            ->setStatusCode(201);
    }

    public function cancelar(Venda $venda): VendaResource
    {
        return new VendaResource(Vendas::cancelar($venda)->load(['cliente', 'vendedor', 'itens']));
    }

    /**
     * Listas do formulário: só clientes, vendedores e produtos ativos, com o saldo de estoque. Vêm
     * por aqui, e não pelos cadastros, porque quem vende pode não ter acesso às telas de cadastro.
     */
    public function opcoes(): JsonResponse
    {
        return response()->json([
            'formas_de_pagamento' => collect(Venda::FORMAS_DE_PAGAMENTO)
                ->map(fn (string $descricao, string $valor) => ['valor' => $valor, 'descricao' => $descricao])
                ->values(),
            'clientes' => Cliente::where('ativo', true)->orderBy('nome')->get()
                ->map(fn (Cliente $cliente) => [
                    'id' => $cliente->id_cliente,
                    'nome' => $cliente->nome,
                    'tipo_pessoa' => $cliente->tipo_pessoa,
                    'cpf_cnpj' => $cliente->cpf_cnpj,
                ]),
            'vendedores' => Vendedor::where('ativo', true)->orderBy('nome')->get()
                ->map(fn (Vendedor $vendedor) => ['id' => $vendedor->id_vendedor, 'nome' => $vendedor->nome]),
            'produtos' => Produto::where('ativo', true)->orderBy('descricao')->get()
                ->map(fn (Produto $produto) => [
                    'id' => $produto->id_produto,
                    'codigo' => $produto->codigo,
                    'descricao' => $produto->descricao,
                    'codigo_barras' => $produto->codigo_barras,
                    'unidade' => $produto->unidade,
                    'preco_venda' => $produto->preco_venda,
                    'controla_estoque' => $produto->controla_estoque,
                    'estoque_atual' => $produto->estoque_atual,
                ]),
        ]);
    }

    /**
     * Valida o corpo da API. Valores vão como texto com casas fixas, para o cálculo em bcmath.
     *
     * @return array{data: string, cliente: int, vendedor: int, forma_pagamento: string, desconto: string, observacoes: ?string, itens: list<array{produto: int, quantidade: string, preco_unitario: string, desconto: string}>}
     */
    private function validar(Request $request): array
    {
        $entrada = $request->all();

        $dados = Validator::make($entrada, [
            'data' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'cliente' => ['required', 'integer', Rule::exists(Cliente::class, 'id_cliente')->where('ativo', true)],
            'vendedor' => ['required', 'integer', Rule::exists(Vendedor::class, 'id_vendedor')->where('ativo', true)],
            'forma_pagamento' => ['required', Rule::in(array_keys(Venda::FORMAS_DE_PAGAMENTO))],
            'desconto' => ['nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999999.99'],
            'observacoes' => ['nullable', 'string', 'max:5000'],
            'itens' => ['required', 'array', 'min:1', 'max:500'],
            'itens.*' => ['array'],
            'itens.*.produto' => [
                'required', 'integer', Rule::exists(Produto::class, 'id_produto')->where('ativo', true),
            ],
            'itens.*.quantidade' => ['required', 'numeric', 'decimal:0,3', 'gt:0', 'max:999999999.999'],
            'itens.*.preco_unitario' => ['required', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999.99'],
            'itens.*.desconto' => ['nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999999.99'],
        ], [
            'data.required' => 'Informe a data da venda.',
            'data.date_format' => 'Informe uma data válida.',
            'data.before_or_equal' => 'A data da venda não pode ser futura.',
            'cliente.required' => 'Escolha o cliente.',
            'cliente.integer' => 'Escolha o cliente.',
            'cliente.exists' => 'Escolha um cliente ativo.',
            'vendedor.required' => 'Escolha o vendedor.',
            'vendedor.integer' => 'Escolha o vendedor.',
            'vendedor.exists' => 'Escolha um vendedor ativo.',
            'forma_pagamento.required' => 'Escolha a forma de pagamento.',
            'forma_pagamento.in' => 'Escolha a forma de pagamento.',
            'desconto.numeric' => 'Informe um valor.',
            'desconto.decimal' => 'Use até 2 casas decimais.',
            'desconto.min' => 'O desconto não pode ser negativo.',
            'observacoes.max' => 'Use no máximo 5.000 caracteres.',
            'itens.required' => 'Inclua ao menos um produto.',
            'itens.min' => 'Inclua ao menos um produto.',
            'itens.max' => 'Use no máximo 500 itens.',
            'itens.*.produto.required' => 'Escolha o produto.',
            'itens.*.produto.exists' => 'Produto inativo ou excluído: tire-o da venda.',
            'itens.*.quantidade.required' => 'Informe a quantidade.',
            'itens.*.quantidade.numeric' => 'Informe uma quantidade.',
            'itens.*.quantidade.decimal' => 'Use até 3 casas decimais.',
            'itens.*.quantidade.gt' => 'A quantidade tem que ser maior que zero.',
            'itens.*.preco_unitario.required' => 'Informe o preço.',
            'itens.*.preco_unitario.numeric' => 'Informe um valor.',
            'itens.*.preco_unitario.decimal' => 'Use até 2 casas decimais.',
            'itens.*.preco_unitario.min' => 'O preço não pode ser negativo.',
            'itens.*.desconto.numeric' => 'Informe um valor.',
            'itens.*.desconto.decimal' => 'Use até 2 casas decimais.',
            'itens.*.desconto.min' => 'O desconto não pode ser negativo.',
        ])->after(function ($validador) use ($entrada) {
            if ($validador->errors()->isNotEmpty()) {
                return;
            }
            // Descontos: o do item não passa do valor do item, e o da venda não passa da soma.
            $subtotal = '0.00';
            foreach ($entrada['itens'] as $indice => $item) {
                $bruto = Vendas::valorBruto(self::decimal($item['quantidade'], 3), self::decimal($item['preco_unitario'], 2));
                $desconto = self::decimal($item['desconto'] ?? 0, 2);
                if (bccomp($desconto, $bruto, 2) > 0) {
                    $validador->errors()->add("itens.{$indice}.desconto", 'O desconto não pode passar do valor do item.');
                }
                $subtotal = bcadd($subtotal, bcsub($bruto, $desconto, 2), 2);
            }
            if (bccomp(self::decimal($entrada['desconto'] ?? 0, 2), $subtotal, 2) > 0) {
                $validador->errors()->add('desconto', 'O desconto não pode passar do subtotal.');
            }
        })->validate();

        return [
            'data' => $dados['data'],
            'cliente' => (int) $dados['cliente'],
            'vendedor' => (int) $dados['vendedor'],
            'forma_pagamento' => $dados['forma_pagamento'],
            'desconto' => self::decimal($dados['desconto'] ?? 0, 2),
            'observacoes' => isset($dados['observacoes']) ? trim($dados['observacoes']) : null,
            'itens' => array_map(fn (array $item) => [
                'produto' => (int) $item['produto'],
                'quantidade' => self::decimal($item['quantidade'], 3),
                'preco_unitario' => self::decimal($item['preco_unitario'], 2),
                'desconto' => self::decimal($item['desconto'] ?? 0, 2),
            ], array_values($dados['itens'])),
        ];
    }

    /** Número já validado (no máximo `$casas` casas) como texto com casas fixas: 2.5 → "2.50". */
    private static function decimal(int|float|string|null $valor, int $casas): string
    {
        return number_format((float) $valor, $casas, '.', '');
    }
}
