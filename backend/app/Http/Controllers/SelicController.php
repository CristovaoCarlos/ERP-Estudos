<?php

namespace App\Http\Controllers;

use App\Http\Resources\SelicResource;
use App\Models\Selic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** Administração › Tabelas Comuns › SELIC: consulta e inclusão das taxas mensais do banco central, da mais recente à mais antiga. */
class SelicController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return SelicResource::collection(Selic::orderByDesc('ano')->orderByDesc('mes')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'ano' => ['required', 'integer', 'between:1990,2100'],
            'mes' => [
                'required', 'integer', 'between:1,12',
                Rule::unique(Selic::class, 'mes')->where('ano', $request->integer('ano')),
            ],
            'valor' => ['nullable', 'numeric', 'min:0', 'max:999.99', 'decimal:0,2'],
        ], [
            'ano.required' => 'Informe o ano.',
            'ano.between' => 'Informe um ano entre 1990 e 2100.',
            'mes.required' => 'Escolha o mês.',
            'mes.between' => 'Mês inválido.',
            'mes.unique' => 'Este mês já tem taxa cadastrada.',
            'valor.numeric' => 'Informe um número.',
            'valor.min' => 'A taxa não pode ser negativa.',
            'valor.max' => 'A taxa tem no máximo 999,99.',
            'valor.decimal' => 'Use no máximo 2 casas decimais.',
        ]);

        // `id` não é autoincremento no legado: o próximo é o maior + 1.
        $selic = DB::connection((new Selic)->getConnectionName())->transaction(fn () => Selic::create([
            'id' => (int) Selic::lockForUpdate()->max('id') + 1,
            'ano' => $dados['ano'],
            'mes' => $dados['mes'],
            'valor' => $dados['valor'] ?? null,
        ]));

        return (new SelicResource($selic))->response()->setStatusCode(201);
    }
}
