# Como criar e vincular usuários

Usuários ficam no banco central (`stm_central`) e só entram nas prefeituras a que estão vinculados.

## Pela tela (recomendado)

**Administração › Usuários** lista quem tem acesso à prefeitura e permite cadastrar, alterar grupos e tirar o acesso. Precisa da permissão `administracao.usuarios`, que hoje só o superadmin tem (nenhum dos três grupos padrão inclui o módulo Administração).

- **CPF já cadastrado no STM:** o usuário existente passa a ter acesso a esta prefeitura, mantendo nome e senha. Um administrador de uma prefeitura não troca a senha de quem também trabalha em outra.
- **Editar vínculos:** botão ao lado do lápis, onde se marcam e desmarcam os grupos do usuário nesta prefeitura. O lápis cuida só de nome, e-mail e senha.
- **Usuário em mais de uma prefeitura:** só os vínculos podem ser alterados aqui.
- **Desativar:** suspende o acesso **nesta** prefeitura e encerra as sessões dele aqui, mantendo cadastro e grupos. Ao tentar entrar, ele recebe "Seu acesso a esta prefeitura está desativado". Reativar devolve o acesso com os mesmos grupos. Em outra prefeitura, ele continua entrando normalmente.
- **Remover:** tira o vínculo e os grupos desta prefeitura; o cadastro continua nas outras. Use desativar quando a saída for temporária.
- Ninguém desativa nem remove o próprio acesso.

## Pelo terminal

### Criar um usuário

```bash
docker compose exec app php artisan usuarios:criar maria@exemplo.com "Maria Souza" --cpf=529.982.247-25 --tenant=lemarq
```

O login é feito com o **CPF** e a senha. A senha é pedida no terminal, sem aparecer na tela. Para scripts, use `--senha=...` (a senha fica no histórico do shell).

### Grupos de acesso

Sem grupo, o usuário entra na prefeitura mas só vê o Início. Toda prefeitura nasce com três grupos, um por módulo do menu:

| Grupo | Telas |
| --- | --- |
| `Administrador` | **Todas**. É do sistema: acompanha as telas novas e não pode ser alterado nem excluído. |
| `Parâmetros` | Parâmetros (receitas, nota fiscal, alvará, ITBI, IPTU, …) |
| `Tabelas` | Tabelas, inclusive Tomadores de Serviço (as Tabelas Comuns são um módulo à parte, só no grupo `Administrador`) |
| `Lançamentos` | Lançamentos, inclusive Imóveis e DAM |

Em **Administração › Grupos de acesso** (permissão `administracao.grupos`) dá para criar outros grupos e mudar os que existem, marcando tela a tela — inclusive misturando módulos, como um grupo "Fiscalização" com Alvará em Parâmetros, Lançamentos e Relatórios. Um grupo em uso não pode ser excluído: tire-o dos usuários antes. Os grupos padrão excluídos voltam no próximo `acesso:sincronizar`; as alterações feitas na tela não são desfeitas pelo comando.

### Pelo terminal

```bash
docker compose exec app php artisan usuarios:criar maria@exemplo.com "Maria Souza" --tenant=lemarq --grupo=Parâmetros --grupo=Tabelas
```

Os grupos valem só nas prefeituras de `--tenant`: a mesma pessoa pode ter grupos diferentes em cada prefeitura. Os grupos e o catálogo de telas ficam em `backend/config/acesso.php` (veja o [ADR-0009](../adr/0009-grupos-de-acesso-e-empresas.md)).

### Superadmin da Lemarq

O superadmin vê todas as telas e é o único que cadastra empresas (Administração › Empresas), mas só quando entra pela prefeitura da Lemarq (`TENANT_ADMINISTRADOR`, padrão `lemarq`). Nas outras prefeituras ele é um usuário comum.

```bash
docker compose exec app php artisan usuarios:criar admin@stm.localhost "Administrador" --tenant=lemarq --superadmin
```

### Dar acesso a mais prefeituras

Rode o mesmo comando com as novas prefeituras. Os vínculos existentes são mantidos:

```bash
docker compose exec app php artisan usuarios:criar maria@exemplo.com "Maria Souza" --tenant=prefeitura_teste
```

> O comando também **troca a senha** do usuário existente pela informada. O CPF é mantido se `--cpf` for omitido.

## Cadastrar o CPF de um usuário antigo

Usuários criados antes do login por CPF não têm CPF e não conseguem entrar. Rode o comando com `--cpf`:

```bash
docker compose exec app php artisan usuarios:criar maria@exemplo.com "Maria Souza" --cpf=529.982.247-25
```

### Ver os vínculos

```bash
docker compose exec app php artisan tinker --execute \
  'echo App\Models\User::where("email", "maria@exemplo.com")->first()->tenants->pluck("id");'
```

### Tirar o acesso a uma prefeitura

```bash
docker compose exec app php artisan tinker --execute \
  'App\Models\User::where("email", "maria@exemplo.com")->first()->tenants()->detach("lemarq");'
```

Tokens que o usuário já tenha continuam válidos, mas qualquer requisição naquela prefeitura passa a receber **403**.

### Encerrar todas as sessões de um usuário

```bash
docker compose exec app php artisan tinker --execute \
  'App\Models\User::where("email", "maria@exemplo.com")->first()->tokens()->delete();'
```
