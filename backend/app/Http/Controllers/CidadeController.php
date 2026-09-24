<?php

namespace App\Http\Controllers;

use App\Http\Resources\CidadeResource;
use App\Models\Cidade;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Administração › Tabelas internas › Cidades: consulta das cidades do banco central.
 * São cerca de 5.600: vão todas de uma vez, e a listagem pagina e filtra no navegador.
 */
class CidadeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CidadeResource::collection(Cidade::orderBy('uf')->orderBy('descricao')->get());
    }
}
