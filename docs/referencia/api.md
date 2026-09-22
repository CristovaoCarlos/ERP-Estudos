# Referência da API

Contrato completo e legível por ferramentas: [`openapi.yaml`](openapi.yaml) (OpenAPI 3.1). Para navegar, abra o arquivo no [Swagger Editor](https://editor.swagger.io/) ou em qualquer visualizador OpenAPI.

## Convenções

- **Formato:** JSON. Envie `Accept: application/json`.
- **Prefeitura:** identificada pelo header `Host` (ex.: `lemarq.localhost`). O frontend não precisa enviar nada além do endereço em que está aberto.
- **Autenticação:** `Authorization: Bearer <token>`, com o token de `POST /api/login`.
- **Erros de validação:** `422` com `{ "message": "...", "errors": { "campo": ["..."] } }`.

## Rotas

| Método | Rota | Domínio | Autenticação | Descrição |
| --- | --- | --- | --- | --- |
| `GET` | `/up` | qualquer | — | Verificação de saúde |
| `GET` | `/api/status` | central | — | Nome da aplicação e status |
| `GET` | `/api/tenant` | prefeitura | — | Id da prefeitura atual |
| `POST` | `/api/login` | prefeitura | — | Entrar; devolve token e usuário |
| `GET` | `/api/me` | prefeitura | token + vínculo | Usuário atual, com as prefeituras a que tem acesso |
| `POST` | `/api/logout` | prefeitura | token + vínculo | Revoga o token atual |

## Códigos de resposta

| Código | Quando |
| --- | --- |
| `200` | Sucesso |
| `204` | Sucesso sem corpo (logout) |
| `401` | Token ausente, inválido ou revogado |
| `403` | Usuário autenticado sem vínculo com a prefeitura |
| `404` | Domínio não pertence a nenhuma prefeitura (`{"message": "Prefeitura não encontrada."}`), ou rota inexistente |
| `422` | Dados inválidos ou credenciais erradas |
| `429` | Mais de 5 tentativas de login por minuto (mesmo CPF + IP) |

## Exemplo

```bash
# login
curl -s http://lemarq.localhost:8000/api/login \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"cpf":"529.982.247-25","password":"<senha>"}'

# usuário atual
curl -s http://lemarq.localhost:8000/api/me \
  -H 'Accept: application/json' -H 'Authorization: Bearer <token>'
```

Se o sistema não resolver `*.localhost`, envie o domínio pelo header: `curl -H 'Host: lemarq.localhost' http://127.0.0.1:8000/api/tenant`.
