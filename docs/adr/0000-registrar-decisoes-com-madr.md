---
status: aceita
data: 2026-09-21
decisores: equipe STM
---

# Registrar decisões de arquitetura com MADR

## Contexto e problema

Decisões como "um banco por prefeitura" ou "usuários centralizados" moldam todo o código, mas o motivo delas se perde em conversas. Como guardar essas decisões para quem chegar depois?

## Fatores de decisão

- Ficar junto do código e versionado no git.
- Formato simples, que não exija ferramenta especial.
- Registrar as alternativas descartadas, não só a escolhida.

## Opções consideradas

- MADR (Markdown Architectural Decision Records)
- ADR no formato original de Michael Nygard
- Wiki externa
- Não registrar

## Decisão

Opção escolhida: **MADR**, porque é Markdown puro, fica no repositório e tem seções para opções consideradas e prós/contras, o que o formato de Nygard não tem.

### Consequências

- Bom, porque o histórico das decisões é revisado nos PRs como qualquer código.
- Ruim, porque exige disciplina para escrever o ADR junto com a mudança.

## Mais informações

- <https://adr.github.io/madr/>
