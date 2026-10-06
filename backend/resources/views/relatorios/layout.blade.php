{{-- Base dos relatórios em PDF. CSS simples (tabelas, sem flex/grid), que qualquer motor de HTML entende. --}}
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>
    body { font-family: dejavusans, sans-serif; font-size: 8.5pt; color: #222; }
    h2 { font-size: 10.5pt; margin: 14pt 0 4pt; }
    .filtros { font-size: 8pt; color: #555; margin-bottom: 8pt; }
    table.dados { width: 100%; border-collapse: collapse; }
    table.dados th { background: #e9ecef; text-align: left; padding: 3pt 4pt; border-bottom: 0.75pt solid #999; font-size: 8pt; }
    table.dados td { padding: 2.5pt 4pt; border-bottom: 0.25pt solid #ddd; vertical-align: top; }
    table.dados tr.par td { background: #f7f7f7; }
    table.dados tfoot td { border-top: 0.75pt solid #999; border-bottom: none; font-weight: bold; background: #fff; }
    .direita, table.dados th.direita { text-align: right; }
    .centro { text-align: center; }
    .mono { font-family: dejavusansmono, monospace; font-size: 7.5pt; }
    .discreto { color: #777; }
    .cancelada td { color: #999; text-decoration: line-through; }
    table.resumo { width: 100%; border-collapse: separate; border-spacing: 4pt 0; margin: 0 -4pt; }
    table.resumo td { border: 0.5pt solid #ccc; padding: 5pt 6pt; width: 20%; }
    table.lado-a-lado { width: 100%; }
    table.lado-a-lado > tr > td, table.lado-a-lado td.coluna { width: 50%; vertical-align: top; }
</style>
</head>
<body>
@yield('conteudo')
</body>
</html>
