# Como criar uma tela sobre uma tabela da prefeitura

Padrão para toda tela nova do menu que lê e grava uma tabela do banco da prefeitura (as tabelas herdadas do legado, em `backend/database/migrations/tenant/`). Há dois tipos:

| Tipo | Quando | Rotas | Referência |
| --- | --- | --- | --- |
| **Formulário único** | a tabela tem um registro só por prefeitura (parâmetros: `tb_parametro_*`, `tb_parametros`…) | `GET` e `PUT` na URL da tela, sem id | **Parâmetros da Empresa › Receitas** |
| **Lista com cadastro** | a tabela tem vários registros (receitas, serviços, cartórios…) | `GET`, `POST`, `PUT {id}`, `DELETE {id}` | frontend de **Administração › Grupos**; backend descrito abaixo |

Arquivos da referência (Parâmetros da Empresa › Receitas):

| Camada | Arquivo |
| --- | --- |
| Model | `backend/app/Models/ParametroReceita.php` |
| Controller | `backend/app/Http/Controllers/ParametroReceitaController.php` |
| Resource | `backend/app/Http/Resources/ParametroReceitaResource.php` |
| Rotas | `backend/routes/tenant.php` (grupo `can:parametros.receitas`) |
| Teste da API | `backend/tests/Feature/ParametroReceitaTest.php` |
| Chamadas à API | `frontend/src/lib/parametros-receitas.ts` |
| Página | `frontend/src/pages/parametros/Receitas.vue` (formulário em `pages/parametros/receitas/FormularioDeReceitas.vue`) |
| Teste da tela | bloco `describe('parâmetros › receitas')` em `frontend/src/App.test.ts` |

## Nomes

A URL da tela manda em todos os outros nomes. Para `/parametros/receitas`:

| O quê | Nome |
| --- | --- |
| Permissão | `parametros.receitas` (URL sem a barra inicial, `/` → `.`) |
| Rotas da API | `/api/parametros/receitas` (+ `/{id}` na lista) e `/api/parametros/receitas/opcoes` |
| Model | tabela legada no singular, sem `tb_`, em PascalCase: `tb_parametro_receita` → `ParametroReceita` |
| Controller, Resource, teste | `<Model>Controller`, `<Model>Resource`, `<Model>Test` |
| Módulo do frontend | `src/lib/<modulo>-<tela>.ts` (`parametros-receitas.ts`) |
| Página | `src/pages/<modulo>/<Tela>.vue` (`pages/parametros/Receitas.vue`); diálogos e formulários dela em `src/pages/<modulo>/<tela>/` |
| `queryKey` | segmentos da URL: `['parametros', 'receitas']` |
| `chave` da `Listagem` | `<modulo>-<tela>`, lembra as colunas escolhidas |

## Tabelas do banco central

As tabelas de `tbcomuns`/`tbinternas` do legado (`tc_*`, `ti_*`) ficam no banco central e valem para todas as prefeituras. As telas delas ficam em **Administração › Tabelas Comuns** e são **só do superadmin**, na prefeitura administradora ([ADR-0014](../adr/0014-tabelas-comuns-so-do-superadmin.md)). O que muda em relação ao resto do guia:

- O model usa `CentralConnection` no lugar de `TenantConnection`; se a chave primária não for autoincremento, `$incrementing = false`. Se ela for um número sem sequência no legado, a inclusão usa o maior + 1 numa transação (veja `CidadeController::store`).
- **Acesso:** a permissão da tela vai na chave `superadmin` de `config/acesso.php`, não no catálogo de grupos. A rota entra no grupo `can:gerenciar-tabelas-comuns` de `routes/tenant.php`, sob o prefixo `administracao/tabelas-comuns`. No frontend, `exclusivaDoSuperadmin()` (`lib/navegacao.ts`) tira a tela da tela de grupos.
- **Testes:** entram como superadmin na prefeitura administradora; os dados vão direto pelo model, fora do `Tenant::run(...)`. Rota nova do módulo entra na lista de `TabelasComunsAcessoTest`, que confere o 403 para os demais.
- **Inclusão:** o botão "Novo…" fica à direita do título e abre o formulário na moldura `DialogoDeCadastro` (`components/DialogoDeCadastro.vue`); os erros 422 voltam para os campos com `mostrarErrosDoServidor` (`lib/formularios.ts`). A descrição do diálogo avisa que o registro vale para todas as prefeituras.
- Tabela de apoio muda pouco: no hook de consulta, `staleTime: Infinity`; as mutações invalidam a consulta.
- Tabelas grandes (Cidades tem ~5.600 linhas) ainda cabem numa resposta só; a `Listagem` pagina e busca no navegador.

Referências: **Cidades** (listagem com filtro por UF e inclusão com `Select`), **Lista de Serviços** e **Segmentos** (inclusão e alteração da descrição, com o código só para leitura na alteração).

## Sem `id_empresa`

O banco já é da prefeitura: `id_empresa` e `tb_empresa` não existem no ERP para Estudos ([ADR-0013](../adr/0013-remove-id-empresa.md)). Nenhuma tela tem campo Empresa, nenhuma consulta filtra por empresa. Tabela nova vinda do legado entra sem essa coluna.

## Backend

### Model

Um model por tabela, no banco da prefeitura:

- `use TenantConnection;`, `$table`, `$primaryKey` (o legado usa `id_<nome>`), `$timestamps = false` e `$guarded = [<chave primária>]`.
- Colunas repetidas por tributo ou tipo (ex.: `id_receita_iss`, `id_receita_iptu`…) ficam numa constante do model (`ParametroReceita::TRIBUTOS`), usada pelo controller, pelo resource e pelos testes.
- Formulário único: um método `atual()` que devolve o registro da prefeitura ou um novo, vazio (`orderBy(<chave>)->firstOrNew()`).

### API

- **Nomes da API em português e sem o jeito do legado.** O corpo e a resposta usam `receitas.iss`, não `id_receita_iss`. A tradução para as colunas fica num método `validar()` privado do controller, que valida e devolve o array pronto para gravar.
- **Formulário único:** `show` (`GET`) e `update` (`PUT`, cria na primeira vez e responde sempre `200`).
- **Lista com cadastro:** `index` (`{data: [...]}`), `store` (`201`), `update` (`PUT /{id}`, `200`), `destroy` (`204`). O parâmetro da rota usa o model (`ParametroX $parametro`).
- **Campos de seleção:** a rota `opcoes` devolve todas as listas do formulário de uma vez. A resposta principal traz só o id; o frontend mostra a descrição a partir das opções.
- **Rotas** num grupo `Route::middleware('can:<permissao>')` em `routes/tenant.php`, com comentário do nome da tela.
- **Resposta:** `JsonResource` com `$wrap = null`.
- **Validação:** `Rule::exists(Model::class, ...)` e `Rule::unique(Model::class, ...)->ignore($id, '<chave primária>')` (a classe do model garante a conexão da prefeitura). Toda mensagem que chega à tela em português, no segundo argumento de `validate()`. Erro de validação é `422` com `errors` por campo, que o frontend mostra embaixo do campo.

### Teste da API

Um `tests/Feature/<Model>Test.php` com os helpers `criarTenant`, `entrar` e `emDemo` (copie da referência) e, no mínimo:

1. sem a permissão da tela → `403`;
2. o caminho feliz completo (formulário único: lê vazio, grava, grava de novo no mesmo registro; lista: cadastra, lista, altera e exclui);
3. cada regra de validação.

Dados de apoio são criados com os models, dentro de `Tenant::find('demo')->run(...)`.

## Frontend

Vue 3 com `<script setup lang="ts">` ([ADR-0016](../adr/0016-frontend-em-vue.md)). Componentes em PascalCase.

### `src/lib/<modulo>-<tela>.ts`

Tipos da API e os composables do vue-query (`useQuery`/`useMutation`; os resultados são `ref`, então no `<script>` use `.value`):

- formulário único: `use<X>()`, `useOpcoes<X>()` e `useSalvar<X>()`, que grava o retorno direto no cache (`setQueryData`);
- lista: `use<Plural>()`, `useOpcoes<Plural>()`, `useCadastrar<X>()`, `useAlterar<X>(id)` e `useRemover<X>()`, que invalidam a `queryKey`.

### Página

Sempre um cabeçalho com `h1` (o título do menu) e uma frase que diz para que a tela serve. Depois:

**Formulário único** (`Receitas.vue`)

- Os dados vêm de duas consultas (registro e opções). Enquanto não chegam, `Skeleton` no lugar dos campos; com erro, `Alert` destrutivo.
- O formulário fica num componente próprio (`receitas/FormularioDeReceitas.vue`), montado só com os dados na mão: ele nunca aparece vazio. Um `watch` na prop do registro chama `resetForm`, e depois de salvar o que foi gravado vira o ponto de partida.
- Dentro de um `Card`: campos em grade (`sm:grid-cols-2 lg:grid-cols-3`) no `CardContent`; no `CardFooter`, **Descartar alterações** (habilitado só com `meta.dirty`) e **Salvar**.

**Lista com cadastro** (`administracao/Grupos.vue`)

- À direita do cabeçalho, o botão `Novo…` com o ícone `Plus`.
- `Listagem` (`@/components/Listagem.vue`) com `colunas: Coluna<T>[]` (`@/lib/listagem`): `valor` para o texto da célula, `busca` quando a coluna entra na busca rápida, `ocultaPorPadrao` nas secundárias, `fixa` na coluna `acoes`. Célula com badge ou botões vem do slot `#coluna-<id>="{ item }"`: em Ações, `Pencil` (`aria-label="Alterar <nome>"`) e `Trash2` (`aria-label="Excluir <nome>"`). `vazio` com título, texto e o componente do ícone do menu.
- Filtros no slot `#filtros`, com `ItemDeFiltro` e os valores marcados em `useSelecao()`; `:filtros-ativos` e `@limpar-filtros` ligam o contador e o "Limpar filtros".
- Formulário num componente da tela (`grupos/FormularioDeGrupo.vue`), em `Dialog` (`max-h-[90svh] overflow-y-auto`) ou na moldura `DialogoDeCadastro`: sem registro cadastra, com registro altera; botão `Cadastrar` ou `Salvar`.
- Exclusão com `DialogoDeConfirmacao` (`Cancelar` e `Excluir` destrutivo), dizendo o que acontece no slot.

**Nos dois**

- `useFormulario(esquema, valoresIniciais)` de `@/lib/formularios` (vee-validate + zod 4). `const [nome] = campo('nome')` dá o `v-model`; `errors.nome` vai em `FieldError :errors="[errors.nome]"` e em `aria-invalid`. Campo aninhado: `campo('administrador.cpf')` e `errors['administrador.cpf']`.
- Máscara (CPF, CNPJ): `:model-value="cpf"` + `@update:model-value="(valor) => (cpf = formatarCpf(String(valor)))"`.
- Seleção: `Select` do shadcn-vue com `v-model`. O Reka UI não aceita valor vazio, então "nenhum" é um valor-sentinela (`NENHUMA`), trocado por `null` ao enviar.
- Erro `422` volta para os campos com `mostrarErrosDoServidor(erro, setFieldError, campos, mensagem)`; o resto vira `toast.error` (`vue-sonner`).
- Botão de envio com `Spinner` enquanto grava; sucesso com `toast.success` curto no particípio (`Parâmetros salvos.`).

### Ligar a tela

1. A tela já está em `src/lib/navegacao.ts`? Se não, adicione (título, URL, ícone do `@lucide/vue`) e a permissão em `backend/config/acesso.php`, e rode `docker compose exec app php artisan acesso:sincronizar`.
2. Em `src/router.ts`, adicione a página ao mapa `paginas` (a URL deixa de abrir `EmConstrucao`).

### Teste da tela

Um bloco `describe('<modulo> › <tela>')` em `src/App.test.ts`, com `mockGet` para `/tenant`, `/me`, os dados e as opções, e `await renderizar(App, '<url>')`. Formulário único: abre com os valores gravados, salva enviando o corpo certo, mostra o erro `422` no campo. Lista: mostra os dados, cadastra, altera e exclui. A validação é assíncrona: confira a chamada à API com `await esperarChamada(post, ...)`. Em selects, confira o valor escolhido (`findByRole('combobox', {name})`) ou escolha a opção com `findByRole('option', {name})`.

## Documentação e checagens

- `docs/referencia/openapi.yaml` (tag do módulo, rotas e schemas) e `docs/referencia/api.md` (uma linha por rota).
- `CHANGELOG.md`, seção `Não lançado`.
- Rode as checagens do CI (veja [Rodar testes e checagens](rodar-testes.md)).
