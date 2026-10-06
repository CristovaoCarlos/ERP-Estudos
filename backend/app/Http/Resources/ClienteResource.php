<?php

namespace App\Http\Resources;

use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Cliente */
class ClienteResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_cliente,
            'tipo_pessoa' => $this->tipo_pessoa,
            'cpf_cnpj' => $this->cpf_cnpj,
            'nome' => $this->nome,
            'nome_fantasia' => $this->nome_fantasia,
            'rg' => $this->rg,
            'data_nascimento' => $this->data_nascimento?->format('Y-m-d'),
            'endereco' => [
                'cep' => $this->cep,
                'logradouro' => $this->logradouro,
                'numero' => $this->numero,
                'complemento' => $this->complemento,
                'bairro' => $this->bairro,
                /** Localização no padrão do Google Maps (graus decimais). */
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,
                'cidade' => $this->cidade ? [
                    'id' => $this->cidade->id_cidade,
                    'nome' => $this->cidade->descricao,
                    'uf' => $this->cidade->uf,
                ] : null,
            ],
            'contato' => [
                'email' => $this->email,
                'telefone' => $this->telefone,
                'celular' => $this->celular,
            ],
            'fiscal' => [
                'indicador_ie' => $this->indicador_ie,
                'inscricao_estadual' => $this->inscricao_estadual,
                'inscricao_municipal' => $this->inscricao_municipal,
                'consumidor_final' => $this->consumidor_final,
            ],
            'limite_credito' => $this->limite_credito,
            'observacoes' => $this->observacoes,
            'ativo' => $this->ativo,
        ];
    }
}
