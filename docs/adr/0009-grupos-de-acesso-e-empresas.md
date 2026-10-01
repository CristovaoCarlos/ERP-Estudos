---
status: aceita
data: 2026-09-22
decisores: equipe STM
---

# Grupos de acesso por módulo, superadmin e cadastro de empresas

## Contexto e problema

Todo usuário vinculado a uma prefeitura via todas as telas, e prefeituras novas só eram criadas pelo tinker. Precisamos definir quem acessa cada tela, em cada prefeitura, e dar à mantenedora do STM uma forma controlada de cadastrar prefeituras clientes (empresas) e provisionar o tenant delas.

## Fatores de decisão

- O mesmo usuário pode trabalhar em várias prefeituras com acessos diferentes ([ADR-0003](0003-usuarios-centralizados.md)).
- As telas futuras precisam nascer protegidas, sem código de permissão espalhado.
- Criar prefeitura é uma operação da plataforma, não de cada prefeitura.

## Opções consideradas

- Uma permissão por tela, agrupadas em grupos por módulo (papéis do spatie no banco de cada prefeitura)
- Uma permissão por módulo
- Superadmin como papel no banco da prefeitura administradora
- Superadmin como coluna no usuário central, com efeito só na prefeitura administradora

## Decisão

**Uma permissão por tela, com nome derivado da URL, e grupos por módulo.** O superadmin é uma **coluna em `users`**, que só vale na prefeitura administradora.

- **Catálogo** (`config/acesso.php`): uma permissão por tela do menu, com o nome da URL sem a barra e com `.` no lugar de `/` (`/parametros/receitas` → `parametros.receitas`). O frontend calcula o mesmo nome (`permissaoDaTela`) e filtra o menu e as rotas com as permissões do `GET /api/me`.
- **Grupos:** `Parâmetros`, `Tabelas` e `Lançamentos`, na ordem do menu. Cada um recebe todas as permissões do módulo. São papéis do spatie no banco de cada prefeitura, criados no provisionamento (`App\Jobs\PrepararPrefeitura`) e por `acesso:sincronizar`.
- **Models `App\Models\Role` e `Permission`** com `TenantConnection`: sem isso, as relações a partir do `User` (conexão central) gravariam os vínculos no banco central.
- **Cache do spatie** separado por prefeitura: a chave ganha o id do tenant ao inicializar a tenancy.
- **Superadmin:** `users.superadmin`, com efeito só quando `tenant('id') === TENANT_ADMINISTRADOR` (padrão `demo`). O `Gate::before` libera tudo para ele. O gate `gerenciar-empresas` protege `/api/empresas`, e a permissão `administracao.empresas` fica fora do catálogo, para não poder ser dada a grupos.
- **Empresas:** a tabela `tenants` ganha `nome`, `cnpj` (único, numérico ou alfanumérico) e `provisionado_em`. `POST /api/empresas` cria o tenant e o domínio no contexto central, e o provisionamento (banco, migrations, grupos) roda em fila. A tela Parâmetros › Empresa saiu do menu.

### Consequências

- Bom, porque uma tela nova só precisa de uma linha em `config/acesso.php` e de `acesso:sincronizar`.
- Bom, porque o superadmin não tem poderes nas prefeituras clientes, mesmo que esteja vinculado a elas.
- Ruim, porque o catálogo existe em dois lugares (`config/acesso.php` e `navegacao.ts`); a regra do nome pela URL mantém os dois alinhados.
- Ruim, porque ainda não há tela para dar grupos a usuários: por enquanto, `usuarios:criar --grupo`.

### Confirmação

`tests/Feature/AcessoTest.php`, `tests/Feature/EmpresasTest.php`, `tests/Unit/CnpjTest.php` e os testes `grupos de acesso` e `empresas` de `frontend/src/App.test.tsx`.
