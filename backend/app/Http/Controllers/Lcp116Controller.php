<?php

namespace App\Http\Controllers;

use App\Http\Resources\Lcp116Resource;
use App\Models\Lcp116;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Administração › Tabelas Comuns › Lista de Serviços - Lei Compl. 116/2003.
 * Lista, inclui e altera a descrição dos itens. Fica no banco central: vale para todas as prefeituras.
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

    public function store(Request $request): JsonResponse
    {
        $codigo = (string) $request->input('codigo');
        $dados = $request->validate([
            'codigo' => ['required', 'regex:/^\d{2}(\.\d{2})?$/', Rule::unique(Lcp116::class, 'codigo')],
            'descricao' => ['required', 'string', 'max:1000'],
        ], [
            'codigo.required' => 'Informe o código.',
            'codigo.regex' => 'Use 01 para item ou 01.01 para subitem.',
            'codigo.unique' => 'Já existe um item com este código.',
            'descricao.required' => 'Informe a descrição.',
            'descricao.max' => 'Use no máximo 1.000 caracteres.',
        ]);

        // O subitem fica debaixo de um item que já exista (01.05 exige o 01).
        if (str_contains($codigo, '.') && ! Lcp116::whereKey(substr($codigo, 0, 2))->exists()) {
            throw ValidationException::withMessages([
                'codigo' => 'Cadastre antes o item '.substr($codigo, 0, 2).'.',
            ]);
        }

        $item = new Lcp116(['descricao' => trim($dados['descricao'])]);
        $item->codigo = $dados['codigo'];
        $item->save();

        return (new Lcp116Resource($item))->response()->setStatusCode(201);
    }
}
