-- O usuário da aplicação cria e exclui os bancos das prefeituras (erp_estudos_tenant_<id>).
-- A imagem do MySQL só lhe dá acesso ao banco central; aqui ele ganha os bancos com prefixo erp_estudos_.
GRANT ALL PRIVILEGES ON `erp\_estudos\_%`.* TO 'erp_estudos'@'%';
FLUSH PRIVILEGES;
