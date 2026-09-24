<?php

namespace App\Http\Controllers;

use App\Http\Resources\SelicResource;
use App\Models\Selic;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Tabelas Comuns › SELIC: consulta das taxas mensais do banco central, da mais recente à mais antiga. */
class SelicController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return SelicResource::collection(Selic::orderByDesc('ano')->orderByDesc('mes')->get());
    }
}
