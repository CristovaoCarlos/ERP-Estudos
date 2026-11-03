<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProdutoResource;
use App\Models\Produto;
use App\Models\Unidade;
use App\Models\VendaItem;
use App\Rules\Gtin;
use App\Support\CacheDeListagens;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Cadastros › Produtos: lista, inclui, altera e exclui os produtos da prefeitura.
 * A API usa nomes agrupados (`precos`, `estoque`, `fiscal`, `pesos`); `validar()` traduz para as
 * colunas de `tb_produto`.
 */
class ProdutoController extends Controller
{
    /** Lista do cache por até 5 minutos (`CacheDeListagens`). */
    public function index(): JsonResponse
    {
        return response()->json(['data' => CacheDeListagens::lembrar(
            CacheDeListagens::PRODUTOS,
            fn () => ProdutoResource::collection(Produto::orderBy('descricao')->get())->resolve(),
        )]);
    }

    public function store(Request $request): JsonResponse
    {
        $produto = Produto::create($this->validar($request));

        return (new ProdutoResource($produto->refresh()))->response()->setStatusCode(201);
    }

    public function update(Request $request, Produto $produto): ProdutoResource
    {
        $produto->update($this->validar($request, $produto));

        return new ProdutoResource($produto->refresh());
    }

    /** Quem já está numa venda não sai do cadastro: o histórico precisa dele. */
    public function destroy(Produto $produto): Response
    {
        if (VendaItem::where('id_produto', $produto->id_produto)->exists()) {
            throw ValidationException::withMessages([
                'produto' => 'Este produto já foi vendido e fica no histórico das vendas: marque-o como inativo em vez de excluir.',
            ]);
        }

        $produto->delete();

        return response()->noContent();
    }

    /**
     * Listas do formulário: unidades (Tabelas Comuns), origens da NF-e e as categorias já usadas
     * (sugestões).
     */
    public function opcoes(): JsonResponse
    {
        $lista = fn (array $itens) => collect($itens)
            ->map(fn (string $descricao, int|string $codigo) => ['valor' => $codigo, 'descricao' => $descricao])
            ->values();

        return response()->json([
            'unidades' => Unidade::orderBy('sigla')->get()
                ->map(fn (Unidade $unidade) => ['valor' => $unidade->sigla, 'descricao' => $unidade->descricao]),
            'origens' => $lista(Produto::ORIGENS),
            'categorias' => Produto::whereNotNull('categoria')->distinct()->orderBy('categoria')->pluck('categoria'),
        ]);
    }

    /**
     * Valida o corpo da API e devolve as colunas de `tb_produto`. Código de barras, NCM e CEST são
     * gravados sem máscara. O estoque atual não vem da API: o produto nasce com 0 e o saldo muda só
     * pela entrada de notas (e pelas vendas); sem controle de estoque, não há mínimo.
     *
     * @return array<string, mixed>
     */
    private function validar(Request $request, ?Produto $produto = null): array
    {
        $entrada = $request->all();
        foreach (['codigo_barras', 'fiscal.ncm', 'fiscal.cest'] as $campo) {
            if (is_string(Arr::get($entrada, $campo))) {
                // Tira só a máscara: letras continuam e são recusadas na validação.
                Arr::set($entrada, $campo, preg_replace('/[\s.\/-]/', '', Arr::get($entrada, $campo)) ?: null);
            }
        }
        if (is_string($entrada['codigo'] ?? null)) {
            $entrada['codigo'] = strtoupper(trim($entrada['codigo']));
        }

        $dados = Validator::make($entrada, [
            'codigo' => [
                'required', 'string', 'max:30', 'regex:/^[A-Z0-9.\/-]+$/',
                Rule::unique(Produto::class, 'codigo')->ignore($produto?->id_produto, 'id_produto'),
            ],
            'descricao' => ['required', 'string', 'max:120'],
            'codigo_barras' => [
                'nullable', 'string', new Gtin,
                Rule::unique(Produto::class, 'codigo_barras')->ignore($produto?->id_produto, 'id_produto'),
            ],
            'unidade' => ['required', 'string', Rule::exists(Unidade::class, 'sigla')],
            'categoria' => ['nullable', 'string', 'max:60'],
            'precos' => ['required', 'array'],
            'precos.custo' => ['nullable', 'numeric', 'min:0', 'max:99999999999.9999'],
            'precos.venda' => ['required', 'numeric', 'min:0', 'max:9999999999999.99'],
            'estoque' => ['required', 'array'],
            'estoque.controla' => ['required', 'boolean'],
            'estoque.minimo' => ['nullable', 'numeric', 'min:0', 'max:999999999999.999'],
            'fiscal' => ['required', 'array'],
            'fiscal.ncm' => ['nullable', 'digits:8'],
            'fiscal.cest' => ['nullable', 'digits:7'],
            'fiscal.origem' => ['required', Rule::in(array_keys(Produto::ORIGENS))],
            'pesos' => ['nullable', 'array'],
            'pesos.bruto' => ['nullable', 'numeric', 'min:0', 'max:999999999.999'],
            'pesos.liquido' => ['nullable', 'numeric', 'min:0', 'max:999999999.999'],
            'observacoes' => ['nullable', 'string', 'max:5000'],
            'ativo' => ['required', 'boolean'],
        ], [
            'codigo.required' => 'Informe o código.',
            'codigo.max' => 'Use no máximo 30 caracteres.',
            'codigo.regex' => 'Use só letras, números, ponto, barra e hífen.',
            'codigo.unique' => 'Já existe um produto com este código.',
            'descricao.required' => 'Informe a descrição.',
            'descricao.max' => 'Use no máximo 120 caracteres (limite da NF-e).',
            'codigo_barras.unique' => 'Já existe um produto com este código de barras.',
            'unidade.required' => 'Escolha a unidade.',
            'unidade.exists' => 'Escolha uma unidade da lista.',
            'categoria.max' => 'Use no máximo 60 caracteres.',
            'precos.required' => 'Informe os preços.',
            'precos.custo.numeric' => 'Informe um valor.',
            'precos.custo.min' => 'O preço de custo não pode ser negativo.',
            'precos.custo.max' => 'Valor alto demais.',
            'precos.venda.required' => 'Informe o preço de venda.',
            'precos.venda.numeric' => 'Informe um valor.',
            'precos.venda.min' => 'O preço de venda não pode ser negativo.',
            'precos.venda.max' => 'Valor alto demais.',
            'estoque.required' => 'Informe o estoque.',
            'estoque.minimo.numeric' => 'Informe uma quantidade.',
            'estoque.minimo.min' => 'O estoque mínimo não pode ser negativo.',
            'fiscal.required' => 'Informe os dados fiscais.',
            'fiscal.ncm.digits' => 'O NCM tem 8 dígitos.',
            'fiscal.cest.digits' => 'O CEST tem 7 dígitos.',
            'fiscal.origem.required' => 'Escolha a origem da mercadoria.',
            'fiscal.origem.in' => 'Escolha a origem da mercadoria.',
            'pesos.bruto.numeric' => 'Informe o peso em kg.',
            'pesos.bruto.min' => 'O peso não pode ser negativo.',
            'pesos.liquido.numeric' => 'Informe o peso em kg.',
            'pesos.liquido.min' => 'O peso não pode ser negativo.',
            'observacoes.max' => 'Use no máximo 5.000 caracteres.',
        ])->after(function ($validador) use ($entrada) {
            $bruto = Arr::get($entrada, 'pesos.bruto');
            $liquido = Arr::get($entrada, 'pesos.liquido');
            if (is_numeric($bruto) && is_numeric($liquido) && $liquido > $bruto) {
                $validador->errors()->add('pesos.liquido', 'O peso líquido não pode passar do bruto.');
            }
        })->validate();

        $controla = (bool) $dados['estoque']['controla'];

        return [
            'codigo' => $dados['codigo'],
            'descricao' => trim($dados['descricao']),
            'codigo_barras' => $dados['codigo_barras'] ?? null,
            'unidade' => $dados['unidade'],
            'categoria' => isset($dados['categoria']) ? trim($dados['categoria']) : null,
            'preco_custo' => $dados['precos']['custo'] ?? null,
            'preco_venda' => $dados['precos']['venda'],
            'controla_estoque' => $controla,
            'estoque_minimo' => $controla ? ($dados['estoque']['minimo'] ?? null) : null,
            'ncm' => $dados['fiscal']['ncm'] ?? null,
            'cest' => $dados['fiscal']['cest'] ?? null,
            'origem' => (int) $dados['fiscal']['origem'],
            'peso_bruto' => $dados['pesos']['bruto'] ?? null,
            'peso_liquido' => $dados['pesos']['liquido'] ?? null,
            'observacoes' => $dados['observacoes'] ?? null,
            'ativo' => (bool) $dados['ativo'],
        ];
    }
}
