<?php

namespace App\Http\Controllers;

use App\Http\Resources\CnaeResource;
use App\Models\Cnae;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Validator;

/**
 * Administração › Tabelas Comuns › CNAE: consulta e inclusão das atividades do banco central.
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

    public function store(Request $request): JsonResponse
    {
        $validador = validator($request->all(), [
            'secao' => ['required', 'regex:/^[A-U]$/'],
            'divisao' => ['nullable', 'regex:/^\d{2}$/', 'required_with:grupo'],
            'grupo' => ['nullable', 'regex:/^\d{2}\.\d$/', 'required_with:classe'],
            'classe' => ['nullable', 'regex:/^\d{2}\.\d{2}-\d$/', 'required_with:subclasse'],
            'subclasse' => ['nullable', 'regex:/^\d{4}-\d\/\d{2}$/'],
            'denominacao' => ['required', 'string', 'max:200'],
            'versao' => ['nullable', 'string', 'max:4'],
            'ativo' => ['boolean'],
        ], [
            'secao.required' => 'Informe a seção.',
            'secao.regex' => 'A seção é uma letra de A a U.',
            'divisao.regex' => 'A divisão tem 2 dígitos (ex.: 85).',
            'grupo.regex' => 'O grupo segue o formato 85.9.',
            'classe.regex' => 'A classe segue o formato 85.93-7.',
            'subclasse.regex' => 'A subclasse segue o formato 8593-7/00.',
            '*.required_with' => 'Informe este nível: o nível abaixo dele foi preenchido.',
            'denominacao.required' => 'Informe a denominação.',
            'denominacao.max' => 'Use no máximo 200 caracteres.',
            'versao.max' => 'Use no máximo 4 caracteres.',
        ]);

        // Cada nível começa pelo código do nível de cima (85 › 85.9 › 85.93-7 › 8593-7/00).
        $validador->after(function (Validator $validador) use ($request) {
            $digitos = fn (?string $codigo) => preg_replace('/\D/', '', (string) $codigo);
            $pares = [['grupo', 'divisao'], ['classe', 'grupo'], ['subclasse', 'classe']];
            foreach ($pares as [$nivel, $pai]) {
                if (filled($request->input($nivel)) && filled($request->input($pai))
                    && ! str_starts_with($digitos($request->input($nivel)), $digitos($request->input($pai)))) {
                    $validador->errors()->add($nivel, 'O código precisa começar pelo código do nível de cima.');
                }
            }
        });

        $dados = $validador->validate();

        $atividade = Cnae::create([
            'sessao' => $dados['secao'],
            'divisao' => $dados['divisao'] ?? null,
            'grupo' => $dados['grupo'] ?? null,
            'classe' => $dados['classe'] ?? null,
            'subclasse' => $dados['subclasse'] ?? null,
            'denominacao' => trim($dados['denominacao']),
            'versao' => $dados['versao'] ?? null,
            'ativo' => $dados['ativo'] ?? true,
        ]);

        return (new CnaeResource($atividade))->response()->setStatusCode(201);
    }
}
