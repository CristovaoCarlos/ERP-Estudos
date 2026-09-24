<?php

namespace App\Http\Controllers;

use App\Http\Resources\DamTipoResource;
use App\Models\DamTipo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Administração › Tabelas Comuns › Tipos de DAM: consulta e inclusão dos tipos de DAM do banco central. */
class DamTipoController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return DamTipoResource::collection(DamTipo::orderBy('cod_dam_tipo')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'codigo' => ['required', 'integer', 'between:1,9999', Rule::unique(DamTipo::class, 'cod_dam_tipo')],
            'descricao' => ['required', 'string', 'max:20'],
        ], [
            'codigo.required' => 'Informe o código.',
            'codigo.integer' => 'O código é um número inteiro.',
            'codigo.between' => 'Use um código de 1 a 9999.',
            'codigo.unique' => 'Já existe um tipo de DAM com este código.',
            'descricao.required' => 'Informe a descrição.',
            'descricao.max' => 'Use no máximo 20 caracteres.',
        ]);

        $tipo = DamTipo::create(['cod_dam_tipo' => $dados['codigo'], 'descricao' => trim($dados['descricao'])]);

        return (new DamTipoResource($tipo))->response()->setStatusCode(201);
    }
}
