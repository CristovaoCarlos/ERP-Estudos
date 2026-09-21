# Como contribuir

## Fluxo

1. Crie uma branch a partir da `main`: `feat/login-peticionante`, `fix/token-expirado`, `docs/guia-deploy`.
2. Faça a mudança **com testes** e **com documentação** (veja abaixo).
3. Rode as checagens: [Como rodar testes](docs/guias/rodar-testes.md).
4. Abra um PR para a `main`. O CI precisa passar.
5. O merge na `main` publica em produção automaticamente.

## Mensagens de commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/), em português:

```
<tipo>(<escopo opcional>): <descrição no imperativo>

<corpo opcional: o porquê da mudança>
```

| Tipo | Quando | Versão |
| --- | --- | --- |
| `feat` | Nova funcionalidade | MINOR |
| `fix` | Correção de bug | PATCH |
| `docs` | Só documentação | — |
| `test` | Só testes | — |
| `refactor` | Mudança de código sem alterar comportamento | — |
| `perf` | Melhoria de desempenho | PATCH |
| `build` | Dependências, Docker, build | — |
| `ci` | Workflows do GitHub Actions | — |
| `chore` | Outras tarefas | — |

Mudança que quebra compatibilidade: `feat!:` ou rodapé `BREAKING CHANGE: ...` → versão MAJOR.

Escopos sugeridos: `backend`, `frontend`, `tenancy`, `auth`, `docker`, `docs`.

Exemplos:

```
feat(auth): adiciona login de peticionante
fix(tenancy): corrige prefixo do banco ao renomear prefeitura
docs(adr): registra decisão sobre expiração de tokens
```

## O que atualizar junto com o código

| Se você… | Atualize |
| --- | --- |
| Criou ou alterou uma rota da API | `docs/referencia/openapi.yaml` e `docs/referencia/api.md` |
| Adicionou variável ao `.env.example` | `docs/referencia/configuracao.md` |
| Criou um comando artisan | `docs/referencia/comandos.md` |
| Tomou uma decisão de arquitetura | Novo ADR em `docs/adr/` |
| Mudou algo visível para o usuário | Seção `Não lançado` do `CHANGELOG.md` |
| Adicionou dependência relevante | `docs/referencia/tecnologias.md` |

## Padrões de código

- **PHP:** Laravel Pint (`vendor/bin/pint`).
- **TypeScript:** ESLint + Prettier (`npm run lint`, `npm run format`).
- Nomes de domínio em português (ex.: `Relatorios`, `usuarios:criar`); termos técnicos do framework em inglês.
- Mensagens para o usuário em português do Brasil.
