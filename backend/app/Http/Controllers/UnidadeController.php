<?php

namespace App\Http\Controllers;

use App\Http\Resources\UnidadeResource;
use App\Models\Unidade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Administração › Tabelas Comuns › Unidades: unidades de medida dos produtos, no banco central
 * (valem para todas as prefeituras). Sem exclusão: a unidade pode estar em uso em qualquer prefeitura.
 */
class UnidadeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UnidadeResource::collection(Unidade::orderBy('sigla')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->merge(['sigla' => strtoupper(trim((string) $request->input('sigla')))]);
        $dados = $request->validate([
            'sigla' => ['required', 'regex:/^[A-Z0-9]{1,6}$/', Rule::unique(Unidade::class, 'sigla')],
            'descricao' => ['required', 'string', 'max:60'],
        ], [
            'sigla.required' => 'Informe a sigla.',
            'sigla.regex' => 'Use de 1 a 6 letras ou números, sem espaço (ex.: UN, KG, M2).',
            'sigla.unique' => 'Já existe uma unidade com esta sigla.',
            ...$this->mensagensDaDescricao(),
        ]);

        $unidade = Unidade::create(['sigla' => $dados['sigla'], 'descricao' => trim($dados['descricao'])]);

        return (new UnidadeResource($unidade))->response()->setStatusCode(201);
    }

    /** Altera a descrição. A sigla não muda: é ela que os produtos guardam. */
    public function update(Request $request, Unidade $unidade): UnidadeResource
    {
        $dados = $request->validate(
            ['descricao' => ['required', 'string', 'max:60']],
            $this->mensagensDaDescricao(),
        );

        $unidade->update(['descricao' => trim($dados['descricao'])]);

        return new UnidadeResource($unidade);
    }

    /** @return array<string, string> */
    private function mensagensDaDescricao(): array
    {
        return [
            'descricao.required' => 'Informe a descrição.',
            'descricao.max' => 'Use no máximo 60 caracteres.',
        ];
    }
}
