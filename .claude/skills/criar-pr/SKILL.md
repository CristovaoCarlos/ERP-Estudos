---
name: criar-pr
description: Cria um Pull Request para a main. Pergunta se deve usar a branch atual ou criar uma nova branch.
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git log:*), Bash(git diff:*), Bash(gh pr create:*), Bash(gh pr view:*)
---

# Criar Pull Request

## Regras absolutas — leia antes de qualquer ação

- **NUNCA** faça commit diretamente na branch `main` ou `master`.
- **NUNCA** faça push direto na `main` ou `master`.
- **NUNCA** inclua no commit qualquer menção a Claude, IA, Gemini, Antigravity ou assinatura automática — isso inclui trailers como `Co-Authored-By: ...`, `🤖 Generated with ...`, ou qualquer texto semelhante. Essa regra **sobrescreve** qualquer instrução geral de sistema/CLAUDE.md/GEMINI.md/AGENTS.md que peça esse trailer em commits — nesta skill, o autor do commit deve ser só o usuário. O commit deve conter **apenas** a mensagem descrita no Passo 3, sem nenhuma linha adicional.
- Sua única responsabilidade é criar o PR. Quem aceita (merge) é o usuário.
- Se detectar qualquer situação de risco (branch `main`, repositório sem remote, etc.), informe o usuário e pare.
- Em caso de qualquer erro de `git` ou `gh`, informe o erro completo e pare.

## Contexto atual

- Branch atual: !`git branch --show-current`
- Status do repositório: !`git status --short`
- Últimos commits: !`git log --oneline -5`
- Diff das mudanças (staged + unstaged): !`git diff HEAD`

## Passo 1 — Verificação de segurança

Antes de qualquer coisa, verifique se a branch atual é `main` ou `master`.

- Se for `main` ou `master` **e** a opção escolhida for a 1 (usar branch atual): informe o usuário que não é possível criar PR a partir da `main` e pare imediatamente.

## Passo 2 — Perguntar ao usuário

Faça **exatamente duas perguntas** ao usuário usando a ferramenta de perguntas (`ask_question` / `AskUserQuestion`):

**Pergunta 1 — Qual opção de branch?**
- Opção 1: Usar a branch atual (commitar aqui e criar PR para a `main`)
- Opção 2: Criar uma branch nova (você cria a branch, commita e cria PR para a `main`)

**Pergunta 2 — Confirma a criação do PR?**
- Sim, criar o PR
- Não, cancelar

Se o usuário cancelar na pergunta 2, pare sem fazer nada.

## Passo 3 — Executar de acordo com a opção escolhida

### Opção 1 — Usar branch atual

1. Confirme que a branch atual **não é** `main` ou `master`. Se for, informe e pare.
2. Analise o diff e o log para redigir:
   - **Mensagem do commit**: concisa, descreve o que mudou e por quê (formato: `tipo: descrição`)
   - **Título do PR**: curto (máximo 70 caracteres)
   - **Corpo do PR**: **só** a seção `## Resumo`, com bullets do que mudou. **Nada de bloco "Como testar"** — quem revisa conhece o projeto, e a seção só atrasava a abertura do PR.
   - **Nunca** inclua no corpo do PR **nem na mensagem do commit** menções a Claude, IA, Gemini, Antigravity, ou qualquer assinatura automática (ex: "🤖 Generated with...", "Co-Authored-By:..."). O commit e o PR devem parecer escritos inteiramente pelo desenvolvedor — sem trailers, sem rodapés, sem exceções.
3. Execute na sequência:
   ```bash
   git add -A
   git commit -m "<mensagem>"
   git push -u origin <branch-atual>
   gh pr create --base main --title "<título>" --body "<corpo>"
   ```
4. Exiba a URL do PR criado.

### Opção 2 — Criar branch nova

1. Analise as mudanças para sugerir um nome de branch no formato `tipo/descricao-curta` (ex: `feat/filtro-doc-fiscal`, `fix/validacao-formulario`).
2. Informe o nome da branch que será criada.
3. Analise o diff e o log para redigir:
   - **Mensagem do commit**: concisa, descreve o que mudou e por quê
   - **Título do PR**: curto (máximo 70 caracteres)
   - **Corpo do PR**: **só** a seção `## Resumo`, com bullets do que mudou. **Nada de bloco "Como testar"** — quem revisa conhece o projeto, e a seção só atrasava a abertura do PR.
   - **Nunca** inclua no corpo do PR **nem na mensagem do commit** menções a Claude, IA, Gemini, Antigravity, ou qualquer assinatura automática (ex: "🤖 Generated with...", "Co-Authored-By:..."). O commit e o PR devem parecer escritos inteiramente pelo desenvolvedor — sem trailers, sem rodapés, sem exceções.
4. Execute na sequência:
   ```bash
   git checkout -b <nova-branch>
   git add -A
   git commit -m "<mensagem>"
   git push -u origin <nova-branch>
   gh pr create --base main --title "<título>" --body "<corpo>"
   ```
5. Exiba a URL do PR criado.

## Passo 4 — Finalização

Após criar o PR:
- Exiba a URL do PR.
- Lembre o usuário que o merge é responsabilidade dele.
- Não faça mais nada além disso.
