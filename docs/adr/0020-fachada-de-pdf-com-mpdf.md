---
status: aceita
data: 2026-10-06
decisores: equipe ERP para Estudos
---

# Fachada de PDF, com o mPDF como motor

## Contexto e problema

Os relatórios (o primeiro é Relatórios › Vendas no período) precisam sair em PDF. O projeto já traz o `mpdf/mpdf`, mas, se cada relatório chamar a biblioteca direto, trocá-la depois exige mexer em todos eles. Como gerar PDF sem amarrar o sistema a uma biblioteca?

## Fatores de decisão

- Trocar de biblioteca sem mexer nos relatórios.
- Escrever o layout em HTML e CSS (views Blade), que a equipe já domina.
- Nada de infraestrutura nova agora (sem Node nem Chromium no contêiner `app`).
- Testar os relatórios sem gerar PDF de verdade em todo teste.

## Opções consideradas

- Fachada própria (`App\Relatorios\Pdf\Pdf`) com um adaptador por biblioteca; mPDF como motor.
- Chamar o mPDF direto em cada relatório.
- Pacote pronto de outra biblioteca (ex.: `barryvdh/laravel-dompdf`) usado direto.

## Decisão

Opção escolhida: **fachada própria com o mPDF como motor**, porque o mPDF já está instalado e a fachada isola a escolha.

- `Pdf` é a única porta de entrada:
  - `Pdf::novo()->titulo()->paisagem()->margens()->cabecalho()->rodape()->view()->html()->quebrarPagina()`;
  - termina em `download()`, `inline()` ou `conteudo()`.
- Cabeçalho e rodapé usam os marcadores `{pagina}` e `{paginas}`, que cada motor traduz (no mPDF, `{PAGENO}` e `{nbpg}`). A quebra de página é CSS padrão (`page-break-before`).
- `MotorDePdf` é o contrato: `gerar(string $html, OpcoesDoPdf $opcoes): string`. `MotorMpdf` é o único arquivo que importa o mPDF.
- `config/relatorios.php` mapeia nomes para adaptadores; `RELATORIOS_MOTOR_PDF` escolhe (padrão `mpdf`). O binding fica em `AppServiceProvider::register()`.
- O mPDF usa a pasta temporária do sistema: o `storage_path` tem sufixo por prefeitura, e a pasta de lá pode não existir.
- As views ficam em `resources/views/relatorios/`, com CSS simples (tabelas, sem flex/grid), que qualquer motor de HTML entende.

### Como trocar de biblioteca

1. Instale a biblioteca e escreva `App\Relatorios\Pdf\Motor<Nome>` implementando `MotorDePdf`.
2. Registre-a em `motores_pdf` de `config/relatorios.php` e aponte `RELATORIOS_MOTOR_PDF` para ela.
3. Rode `php artisan test --filter='PdfTest|RelatorioDeVendasTest'` e confira o layout dos PDFs.

### Consequências

- Bom, porque a troca de biblioteca fica num adaptador, sem tocar nos relatórios.
- Bom, porque os testes trocam o motor por um falso (`tests/Fakes/MotorFalso.php`) e conferem o HTML e as opções.
- Ruim, porque recursos próprios de uma biblioteca (marca-d'água, assinatura, QR Code nativo) precisam passar pela fachada antes de serem usados.
- Ruim, porque o CSS fica limitado ao que o mPDF entende.

### Confirmação

`tests/Unit/PdfTest.php` cobre a fachada com o motor falso e um PDF real do mPDF. `tests/Feature/RelatorioDeVendasTest.php` confere que o relatório passa pela fachada e baixa um PDF de verdade.

## Bibliotecas que podem substituir o mPDF

| Biblioteca | Como gera | Prós | Contras |
| --- | --- | --- | --- |
| **mPDF** (`mpdf/mpdf`), a adotada | HTML/CSS em PHP puro | Já instalada; UTF-8 e acentos; cabeçalho e rodapé com número de página; tabelas longas quebram bem | CSS limitado (sem flex/grid); lenta em PDFs muito grandes |
| **Dompdf** (`dompdf/dompdf`, `barryvdh/laravel-dompdf`) | HTML/CSS 2.1 em PHP puro | Popular no Laravel, fácil de usar | Tabelas grandes lentas e com muita memória; numeração de páginas exige script |
| **TCPDF** (`tecnickcom/tcpdf`) | API de desenho e HTML limitado | Madura; códigos de barras, assinatura digital, PDF/A | API verbosa; HTML fraco; em manutenção mínima |
| **FPDF / FPDI** (`setasign/fpdf`, `setasign/fpdi`) | API de desenho, célula a célula | Muito leve e rápida; FPDI preenche PDFs existentes | Sem HTML: o layout é todo em coordenadas |
| **Browsershot / Laravel PDF** (`spatie/browsershot`, `spatie/laravel-pdf`) | Chrome headless (Puppeteer) | CSS moderno completo, fiel ao navegador | Node e Chromium no contêiner; mais memória e tempo |
| **Gotenberg** (serviço Docker com API HTTP) | Chromium e LibreOffice em contêiner próprio | CSS moderno; o peso fica fora do `app`; também converte DOCX | Um serviço a mais no Compose e na produção |
| **wkhtmltopdf / Snappy** (`knplabs/snappy`) | Binário WebKit antigo | Rápido e conhecido | Projeto arquivado, sem manutenção: não recomendado |
| **jsPDF / pdfmake** | JavaScript no navegador | Sem carga no servidor | Fora da fachada do backend; dados e layout duplicados no frontend |

Se um dia for preciso CSS moderno, as trocas mais prováveis são Gotenberg ou Browsershot.
