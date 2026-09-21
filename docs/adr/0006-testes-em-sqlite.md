---
status: aceita
data: 2026-09-21
decisores: equipe STM
---

# Testes em SQLite, com trava contra o banco real

## Contexto e problema

Os testes usam `RefreshDatabase`, que recria o banco, e criam e apagam prefeituras, o que apaga bancos. Em 21/09/2026, com o `.env` injetado como variáveis de ambiente do contêiner, o `phpunit.xml` não conseguiu trocar a conexão e os testes rodaram no MariaDB de desenvolvimento, apagando dados de teste do `stm_central` e o banco de uma prefeitura.

## Opções consideradas

- SQLite em memória (central) e em arquivo (prefeituras), com trava no `TestCase`
- Banco MariaDB dedicado a testes

## Decisão

Opção escolhida: **SQLite**, com duas proteções:

1. O `docker-compose.yml` **não** usa `env_file`; o Laravel lê o `backend/.env` montado no contêiner, então o `phpunit.xml` consegue sobrescrever `DB_CONNECTION`.
2. `tests/TestCase.php` aborta qualquer teste se a conexão padrão não for `sqlite`.

### Consequências

- Bom, porque a suíte roda em cerca de 1 segundo e não depende de serviço externo.
- Bom, porque é impossível apagar o banco de desenvolvimento rodando testes.
- Ruim, porque diferenças entre SQLite e MariaDB (tipos, JSON) podem esconder bugs; funções específicas de MariaDB precisam de teste manual.

### Confirmação

Rodar `DB_CONNECTION=mariadb php artisan test` falha com "Testes devem rodar em SQLite".
