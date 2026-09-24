<?php

namespace App\Http\Controllers;

use App\Http\Resources\NotaNumeracaoResource;
use App\Models\NotaNumeracao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Administração › Tabelas Comuns › Numeração de Notas: consulta e inclusão dos tipos de numeração da nota fiscal. */
class NotaNumeracaoController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return NotaNumeracaoResource::collection(NotaNumeracao::orderBy('cod_numeracao')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'codigo' => ['required', 'regex:/^[A-Z]$/', Rule::unique(NotaNumeracao::class, 'cod_numeracao')],
            'descricao' => ['required', 'string', 'max:20'],
        ], [
            'codigo.required' => 'Informe o código.',
            'codigo.regex' => 'O código é uma letra maiúscula.',
            'codigo.unique' => 'Já existe uma numeração com este código.',
            'descricao.required' => 'Informe a descrição.',
            'descricao.max' => 'Use no máximo 20 caracteres.',
        ]);

        $numeracao = NotaNumeracao::create([
            'cod_numeracao' => $dados['codigo'],
            'descricao' => trim($dados['descricao']),
        ]);

        return (new NotaNumeracaoResource($numeracao))->response()->setStatusCode(201);
    }
}
