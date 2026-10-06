@php
    use App\Relatorios\Formatar;
    $resumo = $dados['resumo'];
    $filtros = $dados['filtros'];
@endphp
@extends('relatorios.layout')

@section('conteudo')
    <div class="filtros">
        Vendedor: {{ $filtros['vendedor']['nome'] ?? 'todos' }} ·
        Cliente: {{ $filtros['cliente']['nome'] ?? 'todos' }} ·
        Pagamento: {{ $filtros['forma_pagamento'] ? $formas[$filtros['forma_pagamento']] : 'todos' }} ·
        {{ $filtros['incluir_canceladas'] ? 'Lista com as canceladas' : 'Só vendas finalizadas' }}
    </div>

    <table class="resumo">
        <tr>
            <td><span style="font-size: 7.5pt; color: #666;">Vendas finalizadas</span><br><span style="font-size: 12pt; font-weight: bold;">{{ $resumo['quantidade'] }}</span></td>
            <td><span style="font-size: 7.5pt; color: #666;">Soma dos itens</span><br><span style="font-size: 12pt; font-weight: bold;">{{ Formatar::moeda($resumo['subtotal']) }}</span></td>
            <td><span style="font-size: 7.5pt; color: #666;">Descontos</span><br><span style="font-size: 12pt; font-weight: bold;">{{ Formatar::moeda($resumo['descontos']) }}</span></td>
            <td><span style="font-size: 7.5pt; color: #666;">Total vendido</span><br><span style="font-size: 12pt; font-weight: bold;">{{ Formatar::moeda($resumo['total']) }}</span></td>
            <td><span style="font-size: 7.5pt; color: #666;">Ticket médio</span><br><span style="font-size: 12pt; font-weight: bold;">{{ Formatar::moeda($resumo['ticket_medio']) }}</span></td>
        </tr>
    </table>
    @if ($resumo['canceladas']['quantidade'])
        <p class="discreto">
            {{ $resumo['canceladas']['quantidade'] }} venda(s) cancelada(s) no período,
            somando {{ Formatar::moeda($resumo['canceladas']['total']) }}, fora dos totais.
        </p>
    @endif

    <table class="lado-a-lado"><tr>
        <td class="coluna" style="padding-right: 8pt;">
            <h2>Por forma de pagamento</h2>
            <table class="dados">
                <thead><tr><th>Forma de pagamento</th><th class="direita">Vendas</th><th class="direita">Total</th></tr></thead>
                <tbody>
                    @forelse ($dados['por_pagamento'] as $linha)
                        <tr class="{{ $loop->even ? 'par' : '' }}">
                            <td>{{ $linha['descricao'] }}</td>
                            <td class="direita">{{ $linha['quantidade'] }}</td>
                            <td class="direita">{{ Formatar::moeda($linha['total']) }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="3" class="discreto">Nenhuma venda.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </td>
        <td class="coluna" style="padding-left: 8pt;">
            <h2>Por vendedor</h2>
            <table class="dados">
                <thead><tr><th>Vendedor</th><th class="direita">Vendas</th><th class="direita">Total</th><th class="direita">Comissão estimada</th></tr></thead>
                <tbody>
                    @forelse ($dados['por_vendedor'] as $linha)
                        <tr class="{{ $loop->even ? 'par' : '' }}">
                            <td>{{ $linha['nome'] }}</td>
                            <td class="direita">{{ $linha['quantidade'] }}</td>
                            <td class="direita">{{ Formatar::moeda($linha['total']) }}</td>
                            <td class="direita">{{ Formatar::moeda($linha['comissao']) }} <span class="discreto">({{ Formatar::percentual($linha['comissao_percentual']) }})</span></td>
                        </tr>
                    @empty
                        <tr><td colspan="4" class="discreto">Nenhuma venda.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </td>
    </tr></table>

    <h2>Vendas</h2>
    <table class="dados">
        <thead>
            <tr>
                <th>Nº</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Pagamento</th>
                <th class="direita">Itens</th>
                <th class="direita">Desconto</th>
                <th class="direita">Total</th>
                <th>Situação</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($dados['vendas'] as $venda)
                <tr class="{{ $loop->even ? 'par' : '' }} {{ $venda['situacao'] === 'cancelada' ? 'cancelada' : '' }}">
                    <td class="mono">{{ str_pad((string) $venda['id'], 6, '0', STR_PAD_LEFT) }}</td>
                    <td>{{ Formatar::data($venda['data']) }}</td>
                    <td>{{ $venda['cliente']['nome'] }}<br><span class="mono discreto">{{ Formatar::documento($venda['cliente']['cpf_cnpj']) }}</span></td>
                    <td>{{ $venda['vendedor']['nome'] }}</td>
                    <td>{{ $formas[$venda['forma_pagamento']] ?? $venda['forma_pagamento'] }}</td>
                    <td class="direita">{{ $venda['itens'] }}</td>
                    <td class="direita">{{ (float) $venda['desconto'] ? Formatar::moeda($venda['desconto']) : '—' }}</td>
                    <td class="direita">{{ Formatar::moeda($venda['total']) }}</td>
                    <td>{{ $venda['situacao'] === 'cancelada' ? 'Cancelada' : 'Finalizada' }}</td>
                </tr>
            @empty
                <tr><td colspan="9" class="discreto">Nenhuma venda no período.</td></tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td colspan="7">Total das finalizadas ({{ $resumo['quantidade'] }})</td>
                <td class="direita">{{ Formatar::moeda($resumo['total']) }}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>
@endsection
