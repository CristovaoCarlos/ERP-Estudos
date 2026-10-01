# Primeiros passos

Neste tutorial você vai subir o STM na sua máquina, criar uma prefeitura, criar um usuário e entrar no sistema. Leva cerca de 15 minutos.

## O que você precisa

- Docker com Docker Compose
- Node 22 e npm (para o frontend)
- Git

Não é preciso ter PHP, Composer ou MySQL instalados: eles rodam no Docker.

## 1. Configure o backend

Na raiz do projeto:

```bash
cp backend/.env.example backend/.env
```

## 2. Suba os serviços

```bash
HOST_UID=$(id -u) HOST_GID=$(id -g) docker compose up -d --build
```

A primeira vez demora alguns minutos, porque a imagem PHP é compilada. Confira se os seis serviços estão no ar:

```bash
docker compose ps
```

Você deve ver `app`, `worker`, `nginx`, `db` (healthy), `redis` e `mailpit`.

## 3. Instale as dependências e prepare o banco central

```bash
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate
```

Teste a API:

```bash
curl http://localhost:8000/api/status
# {"app":"STM","status":"ok"}
```

## 4. Crie sua primeira prefeitura

```bash
docker compose exec app php artisan tinker --execute \
  'App\Models\Tenant::create(["id" => "demo"])->domains()->create(["domain" => "demo.localhost"]);'
```

O worker cria o banco `stm_tenant_demo` em segundo plano. Em alguns segundos:

```bash
curl -H 'Host: demo.localhost' http://127.0.0.1:8000/api/tenant
# {"id":"demo"}
```

## 5. Crie um usuário com acesso a ela

```bash
docker compose exec app php artisan usuarios:criar admin@stm.localhost "Administrador" --cpf=529.982.247-25 --tenant=demo
```

O comando pede a senha. Use o seu CPF no lugar do exemplo: é ele que você digita no login.

## 6. Rode o frontend

```bash
cd frontend
npm ci
npm run dev
```

## 7. Entre no sistema

Abra <http://demo.localhost:5173>. Você vai cair na tela de login. Entre com o CPF e a senha do passo 5: a página inicial mostra seu nome e a prefeitura `demo`.

Clique em **Sair** para encerrar a sessão.

## O que aconteceu

- O endereço `demo.localhost` identificou a prefeitura; o Vite repassou as chamadas `/api` ao backend mantendo esse endereço.
- O usuário foi criado no banco central (`stm_central`) e vinculado à prefeitura `demo`.
- Os dados da prefeitura ficam no banco `stm_tenant_demo`.

## Próximos passos

- Entenda a arquitetura: [arc42](../arquitetura/arc42.md).
- Crie outras prefeituras: [guia](../guias/criar-tenant.md).
- Veja o banco pelo HeidiSQL: [guia](../guias/acessar-banco.md).
