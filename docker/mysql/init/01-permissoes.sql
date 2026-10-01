-- O usuário da aplicação cria e exclui os bancos das prefeituras (stm_tenant_<id>).
-- A imagem do MySQL só lhe dá acesso ao banco central; aqui ele ganha os bancos com prefixo stm_.
GRANT ALL PRIVILEGES ON `stm\_%`.* TO 'stm'@'%';
FLUSH PRIVILEGES;
