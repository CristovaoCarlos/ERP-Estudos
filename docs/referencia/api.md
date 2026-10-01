# Referência da API

Contrato completo e legível por ferramentas: [`openapi.yaml`](openapi.yaml) (OpenAPI 3.1). Para navegar, abra o arquivo no [Swagger Editor](https://editor.swagger.io/) ou em qualquer visualizador OpenAPI.

## Convenções

- **Formato:** JSON. Envie `Accept: application/json`.
- **Prefeitura:** identificada pelo header `Host` (ex.: `demo.localhost`). O frontend não precisa enviar nada além do endereço em que está aberto.
- **Autenticação:** `Authorization: Bearer <token>`, com o token de `POST /api/login`.
- **Erros de validação:** `422` com `{ "message": "...", "errors": { "campo": ["..."] } }`.

## Rotas

| Método | Rota | Domínio | Autenticação | Descrição |
| --- | --- | --- | --- | --- |
| `GET` | `/up` | qualquer | — | Verificação de saúde |
| `GET` | `/api/status` | central | — | Nome da aplicação e status |
| `GET` | `/api/tenant` | prefeitura | — | Id e nome da prefeitura atual |
| `POST` | `/api/login` | prefeitura | — | Entrar; devolve token e usuário |
| `POST` | `/api/senha/esqueci` | prefeitura | — | Envia e-mail com o link para redefinir a senha |
| `POST` | `/api/senha/redefinir` | prefeitura | — | Redefine a senha com o token do e-mail |
| `PUT` | `/api/me` | prefeitura | token + vínculo | Altera o próprio nome e e-mail (Minha conta) |
| `PUT` | `/api/me/senha` | prefeitura | token + vínculo | Troca a própria senha, conferindo a atual |
| `POST` | `/api/me/foto` | prefeitura | token + vínculo | Envia a foto do usuário (JPEG, PNG ou WebP, até 2 MB) |
| `DELETE` | `/api/me/foto` | prefeitura | token + vínculo | Remove a foto |
| `GET` | `/api/fotos/{arquivo}` | prefeitura | — | Serve a foto; o nome aleatório do arquivo é o segredo |
| `GET` | `/api/me` | prefeitura | token + vínculo | Usuário atual: grupos e permissões nesta prefeitura, se é superadmin e as prefeituras a que tem acesso |
| `POST` | `/api/logout` | prefeitura | token + vínculo | Revoga o token atual |
| `GET` | `/api/usuarios` | prefeitura | `administracao.usuarios` | Usuários com acesso à prefeitura, com os grupos |
| `POST` | `/api/usuarios` | prefeitura | `administracao.usuarios` | Cadastra o usuário ou vincula um já existente (CPF) à prefeitura |
| `PUT` | `/api/usuarios/{id}` | prefeitura | `administracao.usuarios` | Altera nome, e-mail e senha (não mexe nos grupos) |
| `PUT` | `/api/usuarios/{id}/vinculos` | prefeitura | `administracao.usuarios` | Define os grupos do usuário na prefeitura |
| `PUT` | `/api/usuarios/{id}/status` | prefeitura | `administracao.usuarios` | Ativa ou desativa o acesso do usuário à prefeitura |
| `DELETE` | `/api/usuarios/{id}` | prefeitura | `administracao.usuarios` | Tira o acesso do usuário à prefeitura |
| `GET` | `/api/grupos` | prefeitura | `administracao.grupos` ou `administracao.usuarios` | Grupos de acesso, com as telas e a contagem de usuários |
| `POST` | `/api/grupos` | prefeitura | `administracao.grupos` | Cria um grupo com as telas escolhidas |
| `PUT` | `/api/grupos/{id}` | prefeitura | `administracao.grupos` | Altera nome e telas do grupo |
| `DELETE` | `/api/grupos/{id}` | prefeitura | `administracao.grupos` | Exclui o grupo (recusa se houver usuários nele) |
| `GET` | `/api/parametros/receitas` | prefeitura | `parametros.receitas` | Receita usada por cada tributo (um registro só por prefeitura) |
| `PUT` | `/api/parametros/receitas` | prefeitura | `parametros.receitas` | Grava as receitas dos tributos (tributo ausente fica sem receita) |
| `GET` | `/api/parametros/receitas/opcoes` | prefeitura | `parametros.receitas` | Receitas (`tb_receita`) para o formulário |
| `GET` | `/api/administracao/tabelas-comuns/cidades` | prefeitura administradora | superadmin | Cidades do banco central (`tc_cidade`), com UF e código do IBGE |
| `POST` | `/api/administracao/tabelas-comuns/cidades` | prefeitura administradora | superadmin | Inclui uma cidade (código do IBGE único; `id` = maior + 1) |
| `PUT` | `/api/administracao/tabelas-comuns/cidades/{id}` | prefeitura administradora | superadmin | Altera nome e UF da cidade (o código do IBGE não muda) |
| `GET` | `/api/administracao/tabelas-comuns/bancos` | prefeitura administradora | superadmin | Bancos do banco central (`tc_banco`), com o código de compensação |
| `POST` | `/api/administracao/tabelas-comuns/bancos` | prefeitura administradora | superadmin | Inclui um banco (código de compensação de 4 dígitos, único) |
| `GET` | `/api/administracao/tabelas-comuns/cnae` | prefeitura administradora | superadmin | Atividades da CNAE do banco central (`ti_cnae`), versões 2.2 e 2.3, com nível e código |
| `POST` | `/api/administracao/tabelas-comuns/cnae` | prefeitura administradora | superadmin | Inclui uma atividade (cada nível exige o anterior e começa pelo código dele) |
| `GET` | `/api/administracao/tabelas-comuns/lista-de-servicos` | prefeitura administradora | superadmin | Itens e subitens da LC 116/2003 (`ti_lcp116`), ordenados pelo código |
| `POST` | `/api/administracao/tabelas-comuns/lista-de-servicos` | prefeitura administradora | superadmin | Inclui um item (`01`) ou subitem (`01.01`, exige o item) |
| `PUT` | `/api/administracao/tabelas-comuns/lista-de-servicos/{codigo}` | prefeitura administradora | superadmin | Altera a descrição do item (o código não muda; vale para todas as prefeituras) |
| `GET` | `/api/administracao/tabelas-comuns/selic` | prefeitura administradora | superadmin | Taxas SELIC mensais do banco central (`tc_selic`), da mais recente à mais antiga |
| `POST` | `/api/administracao/tabelas-comuns/selic` | prefeitura administradora | superadmin | Inclui a taxa de um mês (um registro por mês) |
| `GET` | `/api/administracao/tabelas-comuns/segmentos` | prefeitura administradora | superadmin | Segmentos de arrecadação da FEBRABAN (`ti_segmentos`), ordenados pelo código |
| `POST` | `/api/administracao/tabelas-comuns/segmentos` | prefeitura administradora | superadmin | Inclui um segmento (código de 1 dígito, único) |
| `PUT` | `/api/administracao/tabelas-comuns/segmentos/{codigo}` | prefeitura administradora | superadmin | Altera a descrição do segmento (o código não muda; vale para todas as prefeituras) |
| `GET` | `/api/administracao/tabelas-comuns/numeracao-de-notas` | prefeitura administradora | superadmin | Tipos de numeração da nota fiscal (`ti_nota_numeracao`), ordenados pelo código |
| `POST` | `/api/administracao/tabelas-comuns/numeracao-de-notas` | prefeitura administradora | superadmin | Inclui um tipo de numeração (código de 1 letra, único) |
| `GET` | `/api/administracao/tabelas-comuns/tipos-de-dam` | prefeitura administradora | superadmin | Tipos de DAM (`ti_dam_tipo`), ordenados pelo código |
| `POST` | `/api/administracao/tabelas-comuns/tipos-de-dam` | prefeitura administradora | superadmin | Inclui um tipo de DAM (código de 1 a 9999, único) |
| `GET` | `/api/empresas` | prefeitura administradora | superadmin | Lista as empresas (prefeituras clientes) |
| `POST` | `/api/empresas` | prefeitura administradora | superadmin | Cadastra uma empresa, cria o administrador dela (`admin_<subdomínio>`) e provisiona a prefeitura (em fila) |

## Códigos de resposta

| Código | Quando |
| --- | --- |
| `200` | Sucesso |
| `204` | Sucesso sem corpo (logout) |
| `401` | Token ausente, inválido ou revogado |
| `403` | Usuário autenticado sem vínculo com a prefeitura, ou sem permissão (ex.: `/api/empresas` para quem não é superadmin na prefeitura administradora) |
| `404` | Domínio não pertence a nenhuma prefeitura (`{"message": "Prefeitura não encontrada."}`), ou rota inexistente |
| `422` | Dados inválidos ou credenciais erradas |
| `429` | Mais de 5 tentativas de login (ou de pedidos de recuperação de senha) por minuto, mesmo CPF + IP |

## Exemplo

```bash
# login
curl -s http://demo.localhost:8000/api/login \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"cpf":"529.982.247-25","password":"<senha>"}'

# usuário atual
curl -s http://demo.localhost:8000/api/me \
  -H 'Accept: application/json' -H 'Authorization: Bearer <token>'
```

Se o sistema não resolver `*.localhost`, envie o domínio pelo header: `curl -H 'Host: demo.localhost' http://127.0.0.1:8000/api/tenant`.
