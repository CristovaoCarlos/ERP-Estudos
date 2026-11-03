---
status: aceita
data: 2026-11-03
decisores: equipe ERP para Estudos
---

# PDF de relatório gerado em segundo plano, na fila

## Contexto e problema

O PDF de Relatórios › Vendas no período era montado dentro da requisição (`GET .../pdf`). Com um período de até 366 dias e muitas vendas, o mPDF pode levar vários segundos: o usuário fica esperando com a tela parada, o processo do PHP-FPM fica preso e, num caso extremo, o nginx ou o `max_execution_time` cortam a resposta. Como gerar o PDF sem prender a requisição?

## Fatores de decisão

- A requisição responde rápido, qualquer que seja o tamanho do relatório.
- A falha na geração aparece para o usuário e fica registrada para quem mantém o sistema.
- Cada prefeitura gera e guarda os próprios arquivos.
- A infraestrutura de fila já existe: Redis, serviço `worker` no Compose e o `QueueTenancyBootstrapper` do stancl/tenancy.

## Opções consideradas

- Job na fila do Laravel, com o pedido gravado no banco e a tela consultando a situação.
- Continuar síncrono, aumentando os limites de tempo.
- Job na fila avisando por WebSocket (Reverb/broadcasting).

## Decisão

Opção escolhida: **job na fila, com consulta da situação pela tela**.

- `POST /api/relatorios/vendas-periodo/pdf` valida os filtros, grava um `RelatorioGerado` (`tb_relatorio_gerado`, situação `pendente`), despacha `App\Jobs\GerarPdfDeVendas` e responde `202` com o id.
- O worker roda o job dentro da prefeitura (o `QueueTenancyBootstrapper` reabre a tenancy pelo id que vai no payload), monta o PDF com `App\Relatorios\PdfDeVendas` e grava em `relatorios/<id>.pdf` no disco `local`, que já tem sufixo por prefeitura. A situação passa a `processando` e depois a `pronto`.
- O job tenta 2 vezes, com 10 segundos entre elas e 240 segundos por tentativa (menos que o `--timeout=300` do worker). Esgotadas as tentativas, `failed()` marca `falhou` com uma mensagem para a tela; o erro técnico fica em `failed_jobs` e no log.
- A tela consulta `GET .../pdf/{id}` a cada 1,5 segundo e, quando `pronto`, baixa `GET .../pdf/{id}/arquivo`. Cada usuário só vê os próprios pedidos.
- O `User` (banco central) não vai para a fila: o job recebe só o nome de quem emitiu.

### Consequências

- Bom, porque a requisição responde na hora e o PHP-FPM fica livre.
- Bom, porque relatórios pesados futuros seguem o mesmo molde (`tipo` em `tb_relatorio_gerado`).
- Ruim, porque sem o worker rodando o pedido fica `pendente` para sempre (a tela desiste depois de 5 minutos).
- Ruim, porque o worker guarda o código em memória: mudou um job, é preciso reiniciá-lo (`docker compose restart worker`, ou `php artisan queue:restart` em produção).
- Ruim, porque os PDFs ficam no disco; uma limpeza dos antigos (comando agendado) fica para depois.

## Prós e contras das opções

### Continuar síncrono, aumentando os limites

- Bom, porque não muda nada na tela nem na API.
- Ruim, porque o usuário continua esperando e cada PDF grande prende um processo do PHP-FPM.

### Job na fila avisando por WebSocket

- Bom, porque a tela é avisada na hora, sem consultas repetidas.
- Ruim, porque exige mais um serviço (Reverb) e autenticação de canais por prefeitura: complexidade demais para um relatório que leva segundos.
