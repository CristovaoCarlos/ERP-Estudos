<?php

namespace App\Http\Controllers;

use App\Http\Resources\DamTipoResource;
use App\Models\DamTipo;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Tabelas Comuns › Tipos de DAM: consulta dos tipos de DAM do banco central. */
class DamTipoController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return DamTipoResource::collection(DamTipo::orderBy('cod_dam_tipo')->get());
    }
}
