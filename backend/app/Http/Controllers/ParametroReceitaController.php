<?php

namespace App\Http\Controllers;

use App\Http\Resources\ParametroReceitaResource;
use App\Models\ParametroReceita;
use App\Models\Receita;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Parâmetros › Receitas: qual receita (`tb_receita`) cada tributo usa no lançamento.
 * É um registro só por prefeitura, então a tela é um formulário: lê e grava, sem lista.
 */
class ParametroReceitaController extends Controller
{
    public function show(): ParametroReceitaResource
    {
        return new ParametroReceitaResource(ParametroReceita::atual());
    }

    /** Receitas para os campos de seleção do formulário. */
    public function opcoes(): JsonResponse
    {
        return response()->json([
            'receitas' => Receita::orderBy('descricao')->get()->map(fn (Receita $receita) => [
                'id' => $receita->id_receita,
                'descricao' => $receita->descricao,
                'sigla' => $receita->sigla,
            ]),
        ]);
    }

    /** Grava o registro da prefeitura, criando na primeira vez. Tributo ausente fica sem receita. */
    public function update(Request $request): JsonResponse
    {
        $parametro = ParametroReceita::atual();
        $parametro->fill($this->validar($request))->save();

        // Sempre 200: para a tela, gravar pela primeira vez não é diferente de alterar.
        return (new ParametroReceitaResource($parametro))->response()->setStatusCode(200);
    }

    /**
     * Valida o corpo `{receitas: {iss, taxa, ...}}` e devolve as colunas da tabela.
     *
     * @return array<string, int|null>
     */
    private function validar(Request $request): array
    {
        $regras = ['receitas' => ['array']];
        foreach (array_keys(ParametroReceita::TRIBUTOS) as $tributo) {
            $regras["receitas.{$tributo}"] = ['nullable', 'integer', Rule::exists(Receita::class, 'id_receita')];
        }

        $dados = $request->validate($regras, [
            'receitas.*.exists' => 'Receita não encontrada.',
        ]);

        return collect(ParametroReceita::TRIBUTOS)
            ->mapWithKeys(fn ($rotulo, $tributo) => [
                ParametroReceita::coluna($tributo) => $dados['receitas'][$tributo] ?? null,
            ])
            ->all();
    }
}
