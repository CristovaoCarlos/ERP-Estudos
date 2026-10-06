<?php

namespace App\Http\Resources;

use App\Models\Vendedor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Vendedor */
class VendedorResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_vendedor,
            'nome' => $this->nome,
            'cpf' => $this->cpf,
            'data_admissao' => $this->data_admissao?->format('Y-m-d'),
            'contato' => [
                'email' => $this->email,
                'celular' => $this->celular,
                'telefone' => $this->telefone,
            ],
            'comercial' => [
                'comissao' => $this->comissao_percentual,
                'meta_mensal' => $this->meta_mensal,
                'regiao' => $this->regiao,
            ],
            'observacoes' => $this->observacoes,
            'ativo' => $this->ativo,
        ];
    }
}
