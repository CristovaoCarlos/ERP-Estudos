<?php

namespace App\Http\Resources;

use App\Models\Cnae;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Atividade da CNAE das tabelas internas (banco central). */

/** @mixin Cnae */
class CnaeResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $nivel = $this->nivel();

        return [
            'id' => $this->getKey(),
            /** Nível da linha na hierarquia: secao, divisao, grupo, classe ou subclasse. */
            'nivel' => $nivel,
            /** Código do nível da linha (ex.: `8593-7/00` numa subclasse, `P` numa seção). */
            'codigo' => $this->{Cnae::NIVEIS[$nivel]},
            'secao' => $this->sessao,
            'divisao' => $this->divisao ?: null,
            'grupo' => $this->grupo ?: null,
            'classe' => $this->classe ?: null,
            'subclasse' => $this->subclasse ?: null,
            'denominacao' => $this->denominacao,
            'versao' => $this->versao,
            'ativo' => $this->ativo !== false,
        ];
    }
}
