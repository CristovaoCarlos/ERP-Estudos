# Documentação do ERP para Estudos

ERP para Estudos. Monorepo com `backend/` (Laravel, API) e `frontend/` (Vue 3), multi-tenant: cada prefeitura é um tenant, com banco de dados próprio, acessado pelo seu subdomínio.

## Como esta documentação está organizada

A documentação segue o framework **[Diátaxis](https://diataxis.fr/)**, que separa o conteúdo pela necessidade de quem lê:

| Seção | Serve para | Conteúdo |
| --- | --- | --- |
| [Tutoriais](tutoriais/) | aprender, do zero | [Primeiros passos](tutoriais/primeiros-passos.md) |
| [Guias](guias/) | resolver uma tarefa específica | [Atualizar o ambiente após um pull](guias/atualizar-ambiente.md) · [Criar uma prefeitura (tenant)](guias/criar-tenant.md) · [Criar e vincular usuários](guias/gerenciar-usuarios.md) · [Criar uma tela de cadastro](guias/criar-tela.md) · [Rodar testes e checagens](guias/rodar-testes.md) · [Acessar o banco de dados](guias/acessar-banco.md) · [Publicar em produção](guias/deploy.md) |
| [Referência](referencia/) | consultar um detalhe | [API](referencia/api.md) ([OpenAPI](referencia/openapi.yaml)) · [Configuração (.env)](referencia/configuracao.md) · [Comandos](referencia/comandos.md) · [Tecnologias](referencia/tecnologias.md) · [Serviços Docker](referencia/servicos-docker.md) · [Banco de dados](referencia/banco-de-dados.md) |
| [Explicação](arquitetura/) | entender o porquê | [Arquitetura (arc42)](arquitetura/arc42.md) · [Decisões de arquitetura (ADRs)](adr/) |

## Padrões adotados

| Padrão | Onde | Por quê |
| --- | --- | --- |
| [Diátaxis](https://diataxis.fr/) | organização de `docs/` | cada documento tem um propósito só; fica claro onde escrever e onde procurar |
| [arc42](https://arc42.org/overview) | [arquitetura/arc42.md](arquitetura/arc42.md) | modelo de 12 seções para documentar arquitetura, amplamente usado |
| [Modelo C4](https://c4model.com/) | diagramas no arc42 | diagramas em níveis (contexto → contêineres → componentes), escritos em Mermaid e versionados com o código |
| [MADR](https://adr.github.io/madr/) | [adr/](adr/) | registra cada decisão de arquitetura com contexto, opções e consequências |
| [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) | [referencia/openapi.yaml](referencia/openapi.yaml) | contrato da API legível por humanos e por ferramentas |
| [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) | [CHANGELOG.md](../CHANGELOG.md) | histórico de mudanças por versão, escrito para pessoas |
| [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/) + [SemVer](https://semver.org/lang/pt-BR/) | [CONTRIBUTING.md](../CONTRIBUTING.md) | mensagens de commit padronizadas que definem a próxima versão |

## Regras para manter a documentação viva

- **Docs-as-code:** a documentação mora no repositório, em Markdown, e muda no mesmo PR que muda o código.
- **Mudou a API?** Atualize `referencia/openapi.yaml` e `referencia/api.md`.
- **Nova variável no `.env.example`?** Atualize `referencia/configuracao.md`.
- **Decisão de arquitetura nova ou revertida?** Crie um ADR novo; não edite o conteúdo de um ADR aceito — marque-o como substituído.
- **Mudança visível para o usuário?** Adicione uma linha em `Não lançado` no `CHANGELOG.md`.
