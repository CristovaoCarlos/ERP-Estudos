<?php

namespace App\Http\Controllers;

use App\Http\Resources\VendedorResource;
use App\Models\Vendedor;
use App\Rules\Cpf;
use App\Support\Cpf as CpfSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Cadastros › Vendedores: lista, inclui, altera e exclui os vendedores da prefeitura.
 * A API agrupa `contato` e `comercial`; `validar()` traduz para as colunas de `tb_vendedor`.
 */
class VendedorController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return VendedorResource::collection(Vendedor::orderBy('nome')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $vendedor = Vendedor::create($this->validar($request));

        return (new VendedorResource($vendedor->refresh()))->response()->setStatusCode(201);
    }

    public function update(Request $request, Vendedor $vendedor): VendedorResource
    {
        $vendedor->update($this->validar($request, $vendedor));

        return new VendedorResource($vendedor->refresh());
    }

    public function destroy(Vendedor $vendedor): Response
    {
        $vendedor->delete();

        return response()->noContent();
    }

    /** Regiões já usadas, para sugestão no formulário. */
    public function regioes(): JsonResponse
    {
        return response()->json([
            'data' => Vendedor::whereNotNull('regiao')->distinct()->orderBy('regiao')->pluck('regiao'),
        ]);
    }

    /**
     * Valida o corpo da API e devolve as colunas de `tb_vendedor`. CPF e telefones são gravados
     * sem máscara.
     *
     * @return array<string, mixed>
     */
    private function validar(Request $request, ?Vendedor $vendedor = null): array
    {
        $entrada = $request->all();
        if (is_string($entrada['cpf'] ?? null)) {
            $entrada['cpf'] = CpfSupport::digitos($entrada['cpf']);
        }
        foreach (['contato.celular', 'contato.telefone'] as $campo) {
            if (is_string(Arr::get($entrada, $campo))) {
                Arr::set($entrada, $campo, preg_replace('/\D/', '', Arr::get($entrada, $campo)) ?: null);
            }
        }

        $dados = Validator::make($entrada, [
            'nome' => ['required', 'string', 'max:150'],
            'cpf' => [
                'required', 'string', new Cpf,
                Rule::unique(Vendedor::class, 'cpf')->ignore($vendedor?->id_vendedor, 'id_vendedor'),
            ],
            'data_admissao' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'contato' => ['required', 'array'],
            'contato.email' => ['nullable', 'email', 'max:150'],
            'contato.celular' => ['required', 'digits:11'],
            'contato.telefone' => ['nullable', 'digits_between:10,11'],
            'comercial' => ['required', 'array'],
            'comercial.comissao' => ['required', 'numeric', 'between:0,100'],
            'comercial.meta_mensal' => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'comercial.regiao' => ['nullable', 'string', 'max:60'],
            'observacoes' => ['nullable', 'string', 'max:5000'],
            'ativo' => ['required', 'boolean'],
        ], [
            'nome.required' => 'Informe o nome.',
            'nome.max' => 'Use no máximo 150 caracteres.',
            'cpf.required' => 'Informe o CPF.',
            'cpf.unique' => 'Já existe um vendedor com este CPF.',
            'data_admissao.date_format' => 'Informe uma data válida.',
            'data_admissao.before_or_equal' => 'A data de admissão não pode ser futura.',
            'contato.required' => 'Informe o contato.',
            'contato.email.email' => 'Informe um e-mail válido.',
            'contato.email.max' => 'Use no máximo 150 caracteres.',
            'contato.celular.required' => 'Informe o celular.',
            'contato.celular.digits' => 'Informe o celular com DDD (11 dígitos).',
            'contato.telefone.digits_between' => 'Informe o telefone com DDD.',
            'comercial.required' => 'Informe os dados comerciais.',
            'comercial.comissao.required' => 'Informe a comissão (0 se não houver).',
            'comercial.comissao.numeric' => 'Informe um percentual.',
            'comercial.comissao.between' => 'A comissão vai de 0 a 100%.',
            'comercial.meta_mensal.numeric' => 'Informe um valor.',
            'comercial.meta_mensal.min' => 'A meta não pode ser negativa.',
            'comercial.meta_mensal.max' => 'Valor alto demais.',
            'comercial.regiao.max' => 'Use no máximo 60 caracteres.',
            'observacoes.max' => 'Use no máximo 5.000 caracteres.',
        ])->validate();

        return [
            'nome' => trim($dados['nome']),
            'cpf' => $dados['cpf'],
            'data_admissao' => $dados['data_admissao'] ?? null,
            'email' => $dados['contato']['email'] ?? null,
            'celular' => $dados['contato']['celular'],
            'telefone' => $dados['contato']['telefone'] ?? null,
            'comissao_percentual' => $dados['comercial']['comissao'],
            'meta_mensal' => $dados['comercial']['meta_mensal'] ?? null,
            'regiao' => isset($dados['comercial']['regiao']) ? trim($dados['comercial']['regiao']) : null,
            'observacoes' => $dados['observacoes'] ?? null,
            'ativo' => (bool) $dados['ativo'],
        ];
    }
}
