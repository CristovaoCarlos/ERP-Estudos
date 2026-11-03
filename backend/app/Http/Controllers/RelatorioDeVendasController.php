<?php

namespace App\Http\Controllers;

use App\Jobs\GerarPdfDeVendas;
use App\Models\Cliente;
use App\Models\RelatorioGerado;
use App\Models\Venda;
use App\Models\Vendedor;
use App\Relatorios\VendasNoPeriodo;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Relatórios › Vendas no período: a prévia em JSON e o PDF, com os mesmos dados
 * (`App\Relatorios\VendasNoPeriodo`). O PDF é gerado em segundo plano, na fila
 * (`App\Jobs\GerarPdfDeVendas`): pedir, acompanhar a situação e baixar o arquivo.
 */
class RelatorioDeVendasController extends Controller
{
    /** Período mais longo aceito, em dias. */
    private const DIAS_NO_PERIODO = 366;

    public function index(Request $request): JsonResponse
    {
        return response()->json((new VendasNoPeriodo($this->filtros($request)))->dados());
    }

    /**
     * Pede o PDF: grava o pedido e o põe na fila. Responde na hora (202); quem gera o arquivo é o
     * worker (`GerarPdfDeVendas`), e a tela acompanha pelo `situacao`.
     */
    public function pedirPdf(Request $request): JsonResponse
    {
        $relatorio = RelatorioGerado::create([
            'user_id' => $request->user()->id,
            'tipo' => 'vendas_periodo',
            'filtros' => $this->filtros($request),
            'situacao' => RelatorioGerado::PENDENTE,
        ]);

        GerarPdfDeVendas::dispatch($relatorio, $request->user()->name);

        return response()->json($relatorio->refresh()->paraApi(), 202);
    }

    /** Em que pé está o pedido (a tela consulta de tempos em tempos). */
    public function situacaoDoPdf(Request $request, int $relatorio): JsonResponse
    {
        return response()->json($this->doUsuario($request, $relatorio)->paraApi());
    }

    /** O arquivo, depois de pronto. */
    public function arquivoDoPdf(Request $request, int $relatorio): StreamedResponse
    {
        $pedido = $this->doUsuario($request, $relatorio);
        abort_unless($pedido->situacao === RelatorioGerado::PRONTO, 409, 'O PDF ainda não está pronto.');

        return Storage::disk('local')->download(
            $pedido->arquivo,
            (new VendasNoPeriodo($pedido->filtros))->arquivo(),
            ['Content-Type' => 'application/pdf'],
        );
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

    /** Pedido de PDF do próprio usuário; o de outro dá 404, como se não existisse. */
    private function doUsuario(Request $request, int $id): RelatorioGerado
    {
        return RelatorioGerado::where('user_id', $request->user()->id)
            ->where('tipo', 'vendas_periodo')
            ->findOrFail($id);
    }

    /**
     * Filtros validados, no formato de `VendasNoPeriodo`.
     *
     * @return array{inicio: string, fim: string, vendedor: ?int, cliente: ?int, forma_pagamento: ?string, incluir_canceladas: bool}
     */
    private function filtros(Request $request): array
    {
        $dados = Validator::make($request->all(), [
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
            $dias = CarbonImmutable::parse($request->input('inicio'))->diffInDays(CarbonImmutable::parse($request->input('fim')));
            if ($dias >= self::DIAS_NO_PERIODO) {
                $validador->errors()->add('fim', 'O período vai até '.self::DIAS_NO_PERIODO.' dias.');
            }
        })->validate();

        return [
            'inicio' => $dados['inicio'],
            'fim' => $dados['fim'],
            'vendedor' => isset($dados['vendedor']) ? (int) $dados['vendedor'] : null,
            'cliente' => isset($dados['cliente']) ? (int) $dados['cliente'] : null,
            'forma_pagamento' => $dados['forma_pagamento'] ?? null,
            'incluir_canceladas' => $request->boolean('incluir_canceladas'),
        ];
    }
}
