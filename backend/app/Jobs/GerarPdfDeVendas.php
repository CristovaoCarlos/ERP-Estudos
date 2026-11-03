<?php

namespace App\Jobs;

use App\Models\RelatorioGerado;
use App\Relatorios\PdfDeVendas;
use App\Relatorios\VendasNoPeriodo;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Gera no worker o PDF de Relatórios › Vendas no período e o grava no disco `local` da prefeitura.
 *
 * Despachado dentro da prefeitura, o job leva o id do tenant no payload e o
 * `QueueTenancyBootstrapper` reabre a tenancy antes do `handle()`: banco, disco e `tenant()` já
 * são os da prefeitura certa. O `RelatorioGerado` vai para a fila só como id (`SerializesModels`)
 * e é relido do banco; o usuário (central) vai só pelo nome.
 */
class GerarPdfDeVendas implements ShouldQueue
{
    use Queueable;

    /** Tentativas antes de desistir (a segunda vem `$backoff` segundos depois). */
    public int $tries = 2;

    public int $backoff = 10;

    /** Segundos de uma tentativa; menor que o `--timeout` do worker (300). */
    public int $timeout = 240;

    public function __construct(public RelatorioGerado $relatorio, public string $emissor) {}

    public function handle(): void
    {
        $this->relatorio->update(['situacao' => RelatorioGerado::PROCESSANDO]);

        $dados = (new VendasNoPeriodo($this->relatorio->filtros))->dados();
        $caminho = "relatorios/{$this->relatorio->id_relatorio_gerado}.pdf";
        Storage::disk('local')->put($caminho, PdfDeVendas::montar($dados, $this->emissor)->conteudo());

        $this->relatorio->update([
            'situacao' => RelatorioGerado::PRONTO,
            'arquivo' => $caminho,
            'concluido_em' => now(),
        ]);
    }

    /** Esgotadas as tentativas: a tela mostra a mensagem; o detalhe fica em `failed_jobs` e no log. */
    public function failed(?Throwable $erro): void
    {
        $this->relatorio->update([
            'situacao' => RelatorioGerado::FALHOU,
            'erro' => 'Não foi possível gerar o PDF. Tente de novo.',
            'concluido_em' => now(),
        ]);
    }
}
