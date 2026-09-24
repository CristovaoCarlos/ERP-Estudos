<?php

namespace App\Http\Controllers;

use App\Http\Resources\SegmentoResource;
use App\Models\Segmento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Administração › Tabelas Comuns › Segmentos: lista, inclui e altera a descrição dos segmentos de arrecadação.
 * Fica no banco central: vale para todas as prefeituras.
 */
class SegmentoController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return SegmentoResource::collection(Segmento::orderBy('codigo')->get());
    }

    public function update(Request $request, Segmento $segmento): SegmentoResource
    {
        $dados = $request->validate([
            'descricao' => ['required', 'string', 'max:50'],
        ], [
            'descricao.required' => 'Informe a descrição.',
            'descricao.max' => 'Use no máximo 50 caracteres.',
        ]);

        $segmento->update(['descricao' => trim($dados['descricao'])]);

        return new SegmentoResource($segmento);
    }

    public function store(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'codigo' => ['required', 'regex:/^\d$/', Rule::unique(Segmento::class, 'codigo')],
            'descricao' => ['required', 'string', 'max:50'],
        ], [
            'codigo.required' => 'Informe o código.',
            'codigo.regex' => 'O código é um dígito, de 0 a 9.',
            'codigo.unique' => 'Já existe um segmento com este código.',
            'descricao.required' => 'Informe a descrição.',
            'descricao.max' => 'Use no máximo 50 caracteres.',
        ]);

        $segmento = new Segmento(['descricao' => trim($dados['descricao'])]);
        $segmento->codigo = $dados['codigo'];
        $segmento->save();

        return (new SegmentoResource($segmento))->response()->setStatusCode(201);
    }
}
