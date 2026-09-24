<?php

namespace App\Http\Controllers;

use App\Http\Resources\SegmentoResource;
use App\Models\Segmento;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Tabelas Comuns › Segmentos: lista e altera a descrição dos segmentos de arrecadação.
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
}
