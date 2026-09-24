<?php

namespace App\Http\Controllers;

use App\Http\Resources\NotaNumeracaoResource;
use App\Models\NotaNumeracao;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Tabelas Comuns › Numeração de Notas: consulta dos tipos de numeração da nota fiscal. */
class NotaNumeracaoController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return NotaNumeracaoResource::collection(NotaNumeracao::orderBy('cod_numeracao')->get());
    }
}
