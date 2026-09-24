<?php

namespace App\Http\Controllers;

use App\Http\Resources\Lcp116Resource;
use App\Models\Lcp116;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Tabelas Comuns › Lista de Serviços - Lei Compl. 116/2003.
 * Lista e altera a descrição dos itens. Fica no banco central: vale para todas as prefeituras.
 */
class Lcp116Controller extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return Lcp116Resource::collection(Lcp116::orderBy('codigo')->get());
    }

    public function update(Request $request, Lcp116 $item): Lcp116Resource
    {
        $dados = $request->validate([
            'descricao' => ['required', 'string', 'max:1000'],
        ], [
            'descricao.required' => 'Informe a descrição.',
            'descricao.max' => 'Use no máximo 1.000 caracteres.',
        ]);

        $item->update(['descricao' => trim($dados['descricao'])]);

        return new Lcp116Resource($item);
    }
}
