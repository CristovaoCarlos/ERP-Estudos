<?php

namespace App\Http\Controllers;

use App\Http\Resources\ClienteResource;
use App\Models\Cidade;
use App\Models\Cliente;
use App\Models\Venda;
use App\Rules\Cnpj;
use App\Rules\Cpf;
use App\Support\Cnpj as CnpjSupport;
use App\Support\Cpf as CpfSupport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Cadastros › Clientes: lista, inclui, altera e exclui os clientes da prefeitura.
 * A API usa nomes em português agrupados (`endereco`, `contato`, `fiscal`); `validar()` traduz
 * para as colunas de `tb_cliente`.
 */
class ClienteController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ClienteResource::collection(Cliente::with('cidade')->orderBy('nome')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $cliente = Cliente::create($this->validar($request));

        return (new ClienteResource($cliente->load('cidade')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Cliente $cliente): ClienteResource
    {
        $cliente->update($this->validar($request, $cliente));

        return new ClienteResource($cliente->load('cidade'));
    }

    /** Quem já está numa venda não sai do cadastro: o histórico precisa dele. */
    public function destroy(Cliente $cliente): Response
    {
        if (Venda::where('id_cliente', $cliente->id_cliente)->exists()) {
            throw ValidationException::withMessages([
                'cliente' => 'Este cliente tem vendas e fica no histórico delas: marque-o como inativo em vez de excluir.',
            ]);
        }

        $cliente->delete();

        return response()->noContent();
    }

    /**
     * Cidades de uma UF para o endereço (são ~5.600 no total: vão por UF). O código do IBGE deixa o
     * frontend achar a cidade devolvida pelo ViaCEP.
     */
    public function cidades(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'uf' => ['required', 'string', 'size:2'],
        ], [
            'uf.required' => 'Informe a UF.',
            'uf.size' => 'Informe a sigla da UF.',
        ]);

        $cidades = Cidade::where('uf', strtoupper($dados['uf']))->orderBy('descricao')->get()
            ->map(fn (Cidade $cidade) => [
                'id' => $cidade->id_cidade,
                'codigo_ibge' => $cidade->codigo,
                'nome' => $cidade->descricao,
            ]);

        return response()->json(['data' => $cidades]);
    }

    /**
     * Valida o corpo da API e devolve as colunas de `tb_cliente`. Documentos, CEP e telefones são
     * gravados sem máscara; o que não vale para o tipo de pessoa ou para o indicador da IE fica vazio.
     *
     * @return array<string, mixed>
     */
    private function validar(Request $request, ?Cliente $cliente = null): array
    {
        $entrada = $request->all();
        $pessoaJuridica = ($entrada['tipo_pessoa'] ?? null) === 'J';

        if (is_string($entrada['cpf_cnpj'] ?? null)) {
            $entrada['cpf_cnpj'] = $pessoaJuridica
                ? CnpjSupport::normalizar($entrada['cpf_cnpj'])
                : CpfSupport::digitos($entrada['cpf_cnpj']);
        }
        foreach (['endereco.cep', 'contato.telefone', 'contato.celular'] as $campo) {
            if (is_string(Arr::get($entrada, $campo))) {
                Arr::set($entrada, $campo, preg_replace('/\D/', '', Arr::get($entrada, $campo)) ?: null);
            }
        }

        $dados = Validator::make($entrada, [
            'tipo_pessoa' => ['required', Rule::in(['F', 'J'])],
            'cpf_cnpj' => [
                'required', 'string', $pessoaJuridica ? new Cnpj : new Cpf,
                Rule::unique(Cliente::class, 'cpf_cnpj')->ignore($cliente?->id_cliente, 'id_cliente'),
            ],
            'nome' => ['required', 'string', 'max:150'],
            'nome_fantasia' => ['nullable', 'string', 'max:150'],
            'rg' => ['nullable', 'string', 'max:20'],
            'data_nascimento' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'endereco' => ['required', 'array'],
            'endereco.cep' => ['required', 'digits:8'],
            'endereco.logradouro' => ['required', 'string', 'max:150'],
            'endereco.numero' => ['required', 'string', 'max:10'],
            'endereco.complemento' => ['nullable', 'string', 'max:60'],
            'endereco.bairro' => ['required', 'string', 'max:60'],
            'endereco.cidade' => ['required', 'integer', Rule::exists(Cidade::class, 'id_cidade')],
            'endereco.latitude' => ['nullable', 'required_with:endereco.longitude', 'numeric', 'between:-90,90'],
            'endereco.longitude' => ['nullable', 'required_with:endereco.latitude', 'numeric', 'between:-180,180'],
            'contato' => ['required', 'array'],
            'contato.email' => ['nullable', 'email', 'max:150'],
            'contato.telefone' => ['nullable', 'digits_between:10,11'],
            'contato.celular' => ['required', 'digits:11'],
            'fiscal' => ['required', 'array'],
            'fiscal.indicador_ie' => ['required', Rule::in(array_keys(Cliente::INDICADORES_IE))],
            'fiscal.inscricao_estadual' => ['nullable', 'required_if:fiscal.indicador_ie,'.Cliente::CONTRIBUINTE, 'string', 'max:20'],
            'fiscal.inscricao_municipal' => ['nullable', 'string', 'max:20'],
            'fiscal.consumidor_final' => ['required', 'boolean'],
            'limite_credito' => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'observacoes' => ['nullable', 'string', 'max:5000'],
            'ativo' => ['required', 'boolean'],
        ], [
            'tipo_pessoa.required' => 'Escolha o tipo de pessoa.',
            'tipo_pessoa.in' => 'Escolha pessoa física ou jurídica.',
            'cpf_cnpj.required' => $pessoaJuridica ? 'Informe o CNPJ.' : 'Informe o CPF.',
            'cpf_cnpj.unique' => 'Já existe um cliente com este CPF/CNPJ.',
            'nome.required' => $pessoaJuridica ? 'Informe a razão social.' : 'Informe o nome.',
            'nome.max' => 'Use no máximo 150 caracteres.',
            'nome_fantasia.max' => 'Use no máximo 150 caracteres.',
            'rg.max' => 'Use no máximo 20 caracteres.',
            'data_nascimento.date_format' => 'Informe uma data válida.',
            'data_nascimento.before_or_equal' => 'A data de nascimento não pode ser futura.',
            'endereco.required' => 'Informe o endereço.',
            'endereco.cep.required' => 'Informe o CEP.',
            'endereco.cep.digits' => 'O CEP tem 8 dígitos.',
            'endereco.logradouro.required' => 'Informe o logradouro.',
            'endereco.numero.required' => 'Informe o número (ou S/N).',
            'endereco.bairro.required' => 'Informe o bairro.',
            'endereco.cidade.required' => 'Escolha a cidade.',
            'endereco.latitude.required_with' => 'Informe a latitude junto com a longitude.',
            'endereco.latitude.numeric' => 'A latitude é um número em graus decimais.',
            'endereco.latitude.between' => 'A latitude vai de -90 a 90.',
            'endereco.longitude.required_with' => 'Informe a longitude junto com a latitude.',
            'endereco.longitude.numeric' => 'A longitude é um número em graus decimais.',
            'endereco.longitude.between' => 'A longitude vai de -180 a 180.',
            'contato.required' => 'Informe o contato.',
            'contato.celular.required' => 'Informe o celular.',
            'endereco.logradouro.max' => 'Use no máximo 150 caracteres.',
            'endereco.numero.max' => 'Use no máximo 10 caracteres.',
            'endereco.complemento.max' => 'Use no máximo 60 caracteres.',
            'endereco.bairro.max' => 'Use no máximo 60 caracteres.',
            'endereco.cidade.exists' => 'Escolha uma cidade da lista.',
            'endereco.cidade.integer' => 'Escolha uma cidade da lista.',
            'contato.email.email' => 'Informe um e-mail válido.',
            'contato.email.max' => 'Use no máximo 150 caracteres.',
            'contato.telefone.digits_between' => 'Informe o telefone com DDD.',
            'contato.celular.digits' => 'Informe o celular com DDD (11 dígitos).',
            'fiscal.required' => 'Informe os dados fiscais.',
            'fiscal.indicador_ie.required' => 'Escolha o indicador da inscrição estadual.',
            'fiscal.indicador_ie.in' => 'Escolha o indicador da inscrição estadual.',
            'fiscal.inscricao_estadual.required_if' => 'Informe a inscrição estadual do contribuinte.',
            'fiscal.inscricao_estadual.max' => 'Use no máximo 20 caracteres.',
            'fiscal.inscricao_municipal.max' => 'Use no máximo 20 caracteres.',
            'limite_credito.numeric' => 'Informe um valor.',
            'limite_credito.min' => 'O limite de crédito não pode ser negativo.',
            'limite_credito.max' => 'Valor alto demais.',
            'observacoes.max' => 'Use no máximo 5.000 caracteres.',
        ])->validate();

        $contribuinte = (int) $dados['fiscal']['indicador_ie'] === Cliente::CONTRIBUINTE;

        return [
            'tipo_pessoa' => $dados['tipo_pessoa'],
            'cpf_cnpj' => $dados['cpf_cnpj'],
            'nome' => $dados['nome'],
            'nome_fantasia' => $pessoaJuridica ? ($dados['nome_fantasia'] ?? null) : null,
            'rg' => $pessoaJuridica ? null : ($dados['rg'] ?? null),
            'data_nascimento' => $pessoaJuridica ? null : ($dados['data_nascimento'] ?? null),
            'cep' => $dados['endereco']['cep'],
            'logradouro' => $dados['endereco']['logradouro'],
            'numero' => $dados['endereco']['numero'],
            'complemento' => $dados['endereco']['complemento'] ?? null,
            'bairro' => $dados['endereco']['bairro'],
            'id_cidade' => $dados['endereco']['cidade'],
            'latitude' => $dados['endereco']['latitude'] ?? null,
            'longitude' => $dados['endereco']['longitude'] ?? null,
            'email' => $dados['contato']['email'] ?? null,
            'telefone' => $dados['contato']['telefone'] ?? null,
            'celular' => $dados['contato']['celular'],
            'indicador_ie' => (int) $dados['fiscal']['indicador_ie'],
            'inscricao_estadual' => $contribuinte ? $dados['fiscal']['inscricao_estadual'] : null,
            'inscricao_municipal' => $dados['fiscal']['inscricao_municipal'] ?? null,
            'consumidor_final' => (bool) $dados['fiscal']['consumidor_final'],
            'limite_credito' => $dados['limite_credito'] ?? null,
            'observacoes' => $dados['observacoes'] ?? null,
            'ativo' => (bool) $dados['ativo'],
        ];
    }
}
