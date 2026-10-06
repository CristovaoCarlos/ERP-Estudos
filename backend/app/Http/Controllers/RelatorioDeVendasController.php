<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Venda;
use App\Models\Vendedor;
use App\Relatorios\Formatar;
use App\Relatorios\Pdf\Pdf;
use App\Relatorios\VendasNoPeriodo;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Relatórios › Vendas no período: a prévia em JSON e o PDF, com os mesmos dados
 * (`App\Relatorios\VendasNoPeriodo`). O PDF sai pela fachada `App\Relatorios\Pdf\Pdf`.
 */
class RelatorioDeVendasController extends Controller
{
    /** Período mais longo aceito, em dias. */
    private const DIAS_NO_PERIODO = 366;

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->relatorio($request)->dados());
    }

    public function pdf(Request $request): Response
    {
        $relatorio = $this->relatorio($request);
        $dados = $relatorio->dados();
        $periodo = Formatar::data($dados['filtros']['inicio']).' a '.Formatar::data($dados['filtros']['fim']);
        $prefeitura = e(tenant('nome') ?? tenant('id'));
        $emissao = 'Emitido em '.Formatar::dataHora(now()).' por '.e($request->user()->name);

        return Pdf::novo()
            ->titulo("Vendas no período {$periodo}")
            ->paisagem()
            ->cabecalho(<<<HTML
                <table width="100%" style="border-bottom: 0.5pt solid #999; font-size: 9pt; color: #333;"><tr>
                    <td><strong style="font-size: 11pt;">{$prefeitura}</strong><br>Relatório de vendas no período</td>
                    <td style="text-align: right;">Período: {$periodo}</td>
                </tr></table>
                HTML)
            ->rodape(<<<HTML
                <table width="100%" style="border-top: 0.5pt solid #999; font-size: 7.5pt; color: #666;"><tr>
                    <td>{$emissao}</td>
                    <td style="text-align: right;">Página {pagina} de {paginas}</td>
                </tr></table>
                HTML)
            ->view('relatorios.vendas-periodo', ['dados' => $dados, 'formas' => Venda::FORMAS_DE_PAGAMENTO])
            ->download($relatorio->arquivo());
    }

    /**
     * Listas dos filtros. Inclui os inativos, que podem ter vendas antigas, e vem por aqui porque
     * quem vê relatórios pode não ter acesso aos cadastros.
     */
    public function opcoes(): JsonResponse
    {
        return response()->json([
            'formas_de_pagamento' => collect(Venda::FORMAS_DE_PAGAMENTO)
                ->map(fn (string $descricao, string $valor) => ['valor' => $valor, 'descricao' => $descricao])
                ->values(),
            'clientes' => Cliente::orderBy('nome')->get()
                ->map(fn (Cliente $cliente) => [
                    'id' => $cliente->id_cliente,
                    'nome' => $cliente->nome,
                    'tipo_pessoa' => $cliente->tipo_pessoa,
                    'cpf_cnpj' => $cliente->cpf_cnpj,
                ]),
            'vendedores' => Vendedor::orderBy('nome')->get()
                ->map(fn (Vendedor $vendedor) => ['id' => $vendedor->id_vendedor, 'nome' => $vendedor->nome]),
        ]);
    }

    private function relatorio(Request $request): VendasNoPeriodo
    {
        $dados = Validator::make($request->query(), [
            'inicio' => ['required', 'date_format:Y-m-d'],
            'fim' => ['required', 'date_format:Y-m-d', 'after_or_equal:inicio'],
            'vendedor' => ['nullable', 'integer', Rule::exists(Vendedor::class, 'id_vendedor')],
            'cliente' => ['nullable', 'integer', Rule::exists(Cliente::class, 'id_cliente')],
            'forma_pagamento' => ['nullable', Rule::in(array_keys(Venda::FORMAS_DE_PAGAMENTO))],
            'incluir_canceladas' => ['nullable', Rule::in(['0', '1', 'true', 'false'])],
        ], [
            'inicio.required' => 'Informe a data inicial.',
            'inicio.date_format' => 'Informe uma data válida.',
            'fim.required' => 'Informe a data final.',
            'fim.date_format' => 'Informe uma data válida.',
            'fim.after_or_equal' => 'A data final não pode ser antes da inicial.',
            'vendedor.exists' => 'Vendedor não encontrado.',
            'cliente.exists' => 'Cliente não encontrado.',
            'forma_pagamento.in' => 'Forma de pagamento desconhecida.',
            'incluir_canceladas.in' => 'Informe sim ou não.',
        ])->after(function ($validador) use ($request) {
            if ($validador->errors()->isNotEmpty()) {
                return;
            }
            $dias = CarbonImmutable::parse($request->query('inicio'))->diffInDays(CarbonImmutable::parse($request->query('fim')));
            if ($dias >= self::DIAS_NO_PERIODO) {
                $validador->errors()->add('fim', 'O período vai até '.self::DIAS_NO_PERIODO.' dias.');
            }
        })->validate();

        return new VendasNoPeriodo([
            'inicio' => $dados['inicio'],
            'fim' => $dados['fim'],
            'vendedor' => isset($dados['vendedor']) ? (int) $dados['vendedor'] : null,
            'cliente' => isset($dados['cliente']) ? (int) $dados['cliente'] : null,
            'forma_pagamento' => $dados['forma_pagamento'] ?? null,
            'incluir_canceladas' => $request->boolean('incluir_canceladas'),
        ]);
    }
}
