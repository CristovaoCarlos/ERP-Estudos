<?php

namespace App\Http\Controllers;

use App\Http\Resources\BancoResource;
use App\Models\Banco;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Administração › Tabelas Comuns › Bancos: consulta e inclusão dos bancos do banco central. */
class BancoController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return BancoResource::collection(Banco::orderBy('codigo')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'codigo' => ['required', 'digits:4', Rule::unique(Banco::class, 'codigo')],
            'nome' => ['required', 'string', 'max:100'],
        ], [
            'codigo.required' => 'Informe o código de compensação.',
            'codigo.digits' => 'O código tem 4 dígitos (com zeros à esquerda, ex.: 0001).',
            'codigo.unique' => 'Já existe um banco com este código.',
            'nome.required' => 'Informe o nome.',
            'nome.max' => 'Use no máximo 100 caracteres.',
        ]);

        $banco = Banco::create(['codigo' => $dados['codigo'], 'descricao' => trim($dados['nome'])]);

        return (new BancoResource($banco))->response()->setStatusCode(201);
    }
}
