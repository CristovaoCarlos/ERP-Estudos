# Como criar e vincular usuários

Usuários ficam no banco central (`stm_central`) e só entram nas prefeituras a que estão vinculados.

## Criar um usuário

```bash
docker compose exec app php artisan usuarios:criar maria@exemplo.com "Maria Souza" --cpf=529.982.247-25 --tenant=lemarq
```

O login é feito com o **CPF** e a senha. A senha é pedida no terminal, sem aparecer na tela. Para scripts, use `--senha=...` (a senha fica no histórico do shell).

## Dar acesso a mais prefeituras

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

## Ver os vínculos

```bash
docker compose exec app php artisan tinker --execute \
  'echo App\Models\User::where("email", "maria@exemplo.com")->first()->tenants->pluck("id");'
```

## Tirar o acesso a uma prefeitura

```bash
docker compose exec app php artisan tinker --execute \
  'App\Models\User::where("email", "maria@exemplo.com")->first()->tenants()->detach("lemarq");'
```

Tokens que o usuário já tenha continuam válidos, mas qualquer requisição naquela prefeitura passa a receber **403**.

## Encerrar todas as sessões de um usuário

```bash
docker compose exec app php artisan tinker --execute \
  'App\Models\User::where("email", "maria@exemplo.com")->first()->tokens()->delete();'
```
