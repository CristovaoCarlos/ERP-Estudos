<?php

namespace App\Http\Controllers;

use App\Http\Resources\CidadeResource;
use App\Models\Cidade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Administração › Tabelas Comuns › Cidades: consulta e inclusão das cidades do banco central.
 * São cerca de 5.600: vão todas de uma vez, e a listagem pagina e filtra no navegador.
 */
class CidadeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CidadeResource::collection(Cidade::orderBy('uf')->orderBy('descricao')->get());
    }

    /** UFs aceitas no cadastro. */
    private const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
        'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

    public function store(Request $request): JsonResponse
    {
        [$regras, $mensagens] = $this->regrasDeNomeEUf();
        $dados = $request->validate([
            'codigo_ibge' => ['required', 'digits:7', Rule::unique(Cidade::class, 'codigo')],
            ...$regras,
        ], [
            'codigo_ibge.required' => 'Informe o código do IBGE.',
            'codigo_ibge.digits' => 'O código do IBGE tem 7 dígitos.',
            'codigo_ibge.unique' => 'Já existe uma cidade com este código do IBGE.',
            ...$mensagens,
        ]);

        // `id_cidade` não é autoincremento no legado: o próximo é o maior + 1.
        $cidade = DB::connection((new Cidade)->getConnectionName())->transaction(fn () => Cidade::create([
            'id_cidade' => (int) Cidade::lockForUpdate()->max('id_cidade') + 1,
            'codigo' => $dados['codigo_ibge'],
            'descricao' => trim($dados['nome']),
            'uf' => $dados['uf'],
        ]));

        return (new CidadeResource($cidade))->response()->setStatusCode(201);
    }

    /** Altera nome e UF. O código do IBGE não muda: é ele que identifica o município. */
    public function update(Request $request, Cidade $cidade): CidadeResource
    {
        [$regras, $mensagens] = $this->regrasDeNomeEUf();
        $dados = $request->validate($regras, $mensagens);

        $cidade->update(['descricao' => trim($dados['nome']), 'uf' => $dados['uf']]);

        return new CidadeResource($cidade);
    }

    /**
     * Regras de nome e UF, iguais na inclusão e na alteração.
     *
     * @return array{0: array<string, list<mixed>>, 1: array<string, string>}
     */
    private function regrasDeNomeEUf(): array
    {
        return [
            [
                'nome' => ['required', 'string', 'max:100'],
                'uf' => ['required', Rule::in(self::UFS)],
            ],
            [
                'nome.required' => 'Informe o nome.',
                'nome.max' => 'Use no máximo 100 caracteres.',
                'uf.required' => 'Escolha a UF.',
                'uf.in' => 'UF inválida.',
            ],
        ];
    }
}
