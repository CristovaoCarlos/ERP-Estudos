---
status: aceita
data: 2026-10-06
decisores: equipe ERP para Estudos
---

# Endereço pelo CEP com o ViaCEP, consultado pelo navegador

## Contexto e problema

No cadastro de clientes, digitar o endereço inteiro é lento e gera grafias diferentes para a mesma rua. O usuário pediu o preenchimento automático pelo CEP. Não temos base própria de CEPs. De onde vem o endereço, e quem faz a consulta?

## Fatores de decisão

- Sem custo e sem cadastro de chave.
- O token do ERP não pode sair do sistema.
- A cidade precisa casar com `tc_cidade` (banco central), sem depender da grafia do nome.
- Se o serviço cair, o cadastro continua funcionando à mão.

## Opções consideradas

- ViaCEP consultado direto pelo navegador.
- ViaCEP consultado pelo backend (rota própria que repassa).
- Base de CEPs própria.

## Decisão

Opção escolhida: **ViaCEP pelo navegador** (`buscarCep` em `src/lib/cadastros-clientes.ts`).

- A consulta usa `fetch` puro, e não o cliente `api`: nenhum header de autorização vai para o ViaCEP. O ViaCEP aceita chamadas de outros domínios (CORS).
- Só consulta quando o usuário digita um CEP completo (8 dígitos). Preenche logradouro, bairro, UF e cidade; o complemento só se estiver vazio.
- A cidade é achada pelo **código do IBGE** que o ViaCEP devolve (`ibge`), comparado com `tc_cidade.codigo`. Por isso `GET /api/cadastros/clientes/cidades` devolve `codigo_ibge`.
- CEP inexistente vira erro no campo. Falha de rede vira um aviso, e o endereço é digitado à mão.

### Consequências

- Bom, porque não há infraestrutura nova nem chave para guardar.
- Bom, porque a carga fica no navegador de quem cadastra, sem passar pelo servidor do ERP.
- Ruim, porque o CEP digitado vai a um serviço de terceiro. O CEP sozinho não identifica o cliente.
- Ruim, porque o ERP depende da disponibilidade do ViaCEP para o preenchimento automático (não para o cadastro).

### Confirmação

`src/App.test.ts` ("cadastros › clientes") simula o `fetch`: confere a URL chamada, que a chamada vai sem opções (sem token), o preenchimento com a cidade pelo código do IBGE e o aviso de CEP inexistente.

## Prós e contras das opções

### ViaCEP pelo backend

- Bom, porque permitiria cache e troca de provedor sem mexer no frontend.
- Ruim, porque o servidor do ERP passaria a depender de saída para a internet e somaria uma rota só para repassar.

### Base de CEPs própria

- Bom, porque não depende de terceiros.
- Ruim, porque exige carga e atualização periódica de uma base grande.
