---
status: aceita
data: 2026-09-22
decisores: equipe STM
---

# Grupo Administrador do sistema e o usuário admin de cada prefeitura

## Contexto e problema

Depois do [ADR-0010](0010-grupos-editaveis-na-tela.md), cada prefeitura monta os próprios grupos. Faltavam duas coisas: um grupo com acesso a tudo, que não dependa de alguém montar tela a tela, e um primeiro usuário na prefeitura nova — sem ele, só o superadmin consegue entrar, e a prefeitura não administra a si mesma.

## Fatores de decisão

- Prefeitura provisionada precisa nascer utilizável, sem intervenção manual.
- O superadmin não deve ser o operador do dia a dia das prefeituras.
- Um grupo de acesso total não pode ser esvaziado ou apagado por engano.

## Opções consideradas

- Grupo `Administrador` fixo, criado e mantido pelo sistema
- Deixar cada prefeitura montar um grupo equivalente
- Criar o usuário administrador só quando alguém pedir

## Decisão

**Grupo `Administrador` do sistema em toda prefeitura, e um usuário administrador criado junto com a empresa.**

- `Administrador` é criado no provisionamento com **todas** as telas do catálogo. O `acesso:sincronizar` acerta as permissões dele a cada execução, então tela nova entra sozinha (os demais grupos continuam intocados).
- A API recusa alterar ou excluir esse grupo (`sistema: true` no `GET /api/grupos`), e a tela esconde as ações dele.
- `POST /api/empresas` passa a exigir os dados do administrador (CPF, e-mail e senha). O usuário é criado como **`admin_<subdominio>`** (o subdomínio com `_` no lugar de `-`), vinculado à prefeitura nova. Se o CPF já existir no STM, o usuário existente é aproveitado, mantendo nome e senha.
- O vínculo com o grupo acontece no fim do provisionamento (`App\Jobs\PrepararPrefeitura`), quando o banco da prefeitura já existe. Até lá, o id do usuário fica em `tenants.data.administrador_id`.

### Consequências

- Bom, porque a prefeitura nova já nasce com quem a administre, sem passo manual.
- Bom, porque `Administrador` acompanha o catálogo: nenhuma tela nova fica sem dono.
- Ruim, porque o cadastro de empresa ficou maior: sem CPF, e-mail e senha do administrador não dá para criar a prefeitura.
- Ruim, porque a senha inicial é definida por quem cadastra a empresa; o administrador deve trocá-la em Minha conta.

### Confirmação

`tests/Feature/EmpresasTest.php` (`test_administrador_da_prefeitura_entra_e_ve_tudo`, `test_exige_os_dados_do_administrador`), `tests/Feature/GruposTest.php` (`test_grupo_administrador_nao_pode_ser_alterado_nem_excluido`, `test_tela_nova_no_catalogo_entra_no_administrador`).
