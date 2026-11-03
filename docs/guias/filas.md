# Processar em segundo plano com filas

Como o ERP usa a **fila do Laravel** para tirar trabalho pesado da requisição, com o exemplo real do PDF de Relatórios › Vendas no período ([ADR-0022](../adr/0022-pdf-de-relatorio-em-segundo-plano.md)).

## A ideia

Numa requisição comum, o navegador espera o PHP terminar tudo. Com fila, a requisição só **anota o trabalho** numa lista (no Redis) e responde. Outro processo, o **worker**, fica lendo essa lista e executa cada item, chamado **job**.

```
Tela ──POST /pdf──▶ Controller ──grava "pendente"──▶ GerarPdfDeVendas::dispatch() ──▶ Redis
  ▲                    └── responde 202 {id}                                            │
  │                                                                                     ▼
  ├── GET /pdf/{id} a cada 1,5 s ◀── pendente → processando → pronto/falhou ◀──── worker
  └── GET /pdf/{id}/arquivo quando "pronto"                       (handle() grava o PDF no disco)
```

## As peças no código

| Peça | Arquivo | Papel |
| --- | --- | --- |
| Configuração | `backend/.env` (`QUEUE_CONNECTION=redis`), `config/queue.php` | Onde os jobs ficam guardados |
| Worker | serviço `worker` do `docker-compose.yml` (`php artisan queue:work --timeout=300 --tries=1`) | Processo que executa os jobs |
| Pedido | `app/Models/RelatorioGerado.php` (`tb_relatorio_gerado`) | Situação que a tela acompanha |
| Despacho | `RelatorioDeVendasController::pedirPdf` | Cria o pedido e chama `GerarPdfDeVendas::dispatch(...)` |
| Job | `app/Jobs/GerarPdfDeVendas.php` | `handle()` gera o PDF; `failed()` registra a falha |
| Tela | `frontend/src/lib/relatorios-vendas.ts` (`baixarPdfDoRelatorio`) | Pede, consulta a situação e baixa |

### Anatomia de um job

```php
class GerarPdfDeVendas implements ShouldQueue   // ShouldQueue: vai para a fila em vez de rodar na hora
{
    use Queueable;                              // dispatch(), fila, atraso e serialização dos models

    public int $tries = 2;                      // tentativas antes de desistir
    public int $backoff = 10;                   // segundos entre uma tentativa e outra
    public int $timeout = 240;                  // limite de uma tentativa (menor que o --timeout do worker)

    public function __construct(public RelatorioGerado $relatorio, public string $emissor) {}

    public function handle(): void { /* o trabalho */ }

    public function failed(?Throwable $erro): void { /* esgotou as tentativas */ }
}
```

- **O que vai para a fila são os dados do construtor**, serializados. Um model vai só como classe + id (`SerializesModels`) e é **relido do banco** no worker; por isso o job vê a versão atual do registro.
- Passe dados simples. O `User` mora no banco central (`CentralConnection`); o job recebe só o nome de quem emitiu.

### E a prefeitura?

O worker é um processo só, para todas as prefeituras. Quem resolve é o `QueueTenancyBootstrapper` (ativo em `config/tenancy.php`): ao despachar dentro de uma prefeitura, o id do tenant vai junto no payload; antes do `handle()`, o worker reabre a tenancy. Banco, cache, disco `local` e `tenant()` passam a ser os da prefeitura certa, sem nenhum código a mais no job.

## Na prática

```bash
docker compose logs -f worker                         # ver os jobs passando (RUNNING / DONE / FAIL)
docker compose restart worker                         # depois de mudar um job: o worker guarda o código em memória!
docker compose exec app php artisan queue:failed      # jobs que falharam (tabela failed_jobs)
docker compose exec app php artisan queue:retry all   # tentar de novo os que falharam
docker compose exec app php artisan queue:clear redis # esvaziar a fila
```

Experimento para ver a fila funcionando:

1. `docker compose stop worker`.
2. Em Relatórios › Vendas no período, clique em **Exportar PDF**: o botão fica em "Gerando PDF…" e o pedido, `pendente`. O job está esperando no Redis.
3. `docker compose start worker`: em instantes o log mostra `App\Jobs\GerarPdfDeVendas ... DONE` e o download acontece.

Para ver uma falha, lance uma exceção no `handle()`, reinicie o worker e peça o PDF: depois de 2 tentativas, a tela avisa e `queue:failed` mostra o erro.

## Nos testes

O `phpunit.xml` usa `QUEUE_CONNECTION=sync`: o job roda **dentro da própria requisição**, então o teste já vê o pedido `pronto`. Para testar só o despacho, sem executar:

```php
Queue::fake();
$this->postJson('http://demo.localhost/api/relatorios/vendas-periodo/pdf', [...])->assertAccepted();
Queue::assertPushed(GerarPdfDeVendas::class);
```

Veja `backend/tests/Feature/RelatorioDeVendasTest.php`.

## Outros usos de fila no projeto

- Provisionamento de prefeitura: `TenancyServiceProvider` encadeia `CreateDatabase`, `MigrateDatabase` e `PrepararPrefeitura` num `JobPipeline` que vai para a fila.
- E-mail de recuperação de senha: a notificação `RedefinirSenha` implementa `ShouldQueue`.

## Próximos passos para estudar

- Comando agendado (`routes/console.php`, `Schedule`) que apaga os PDFs com mais de 7 dias em cada prefeitura.
- `ShouldBeUnique` para não enfileirar dois pedidos iguais do mesmo usuário.
- Filas com nome (`->onQueue('relatorios')`) e um worker dedicado a elas.
- Lotes (`Bus::batch`) e cadeias (`Bus::chain`) de jobs.
