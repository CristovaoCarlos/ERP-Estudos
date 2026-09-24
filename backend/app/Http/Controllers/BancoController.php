<?php

namespace App\Http\Controllers;

use App\Http\Resources\BancoResource;
use App\Models\Banco;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Administração › Tabelas internas › Bancos: consulta dos bancos do banco central. */
class BancoController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return BancoResource::collection(Banco::orderBy('codigo')->get());
    }
}
