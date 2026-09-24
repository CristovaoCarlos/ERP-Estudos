<?php

namespace App\Http\Controllers;

use App\Http\Resources\CnaeResource;
use App\Models\Cnae;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Administração › Tabelas internas › CNAE: consulta das atividades do banco central.
 * São cerca de 4.800 linhas (duas versões): vão todas, e a listagem pagina e filtra no navegador.
 */
class CnaeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        // Versão mais nova primeiro e, dentro dela, na ordem da hierarquia (o pai antes dos filhos).
        $atividades = Cnae::orderByDesc('versao')
            ->orderBy('sessao')
            ->orderByRaw("coalesce(divisao, '')")
            ->orderByRaw("coalesce(grupo, '')")
            ->orderByRaw("coalesce(classe, '')")
            ->orderByRaw("coalesce(subclasse, '')")
            ->get();

        return CnaeResource::collection($atividades);
    }
}
