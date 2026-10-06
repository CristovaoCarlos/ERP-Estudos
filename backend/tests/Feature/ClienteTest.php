<?php

namespace Tests\Feature;

use App\Models\Cidade;
use App\Models\Cliente;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Cnpj;
use App\Support\Cpf;
use Database\Seeders\ClienteSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClienteTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        tenancy()->end();
        foreach (Tenant::all() as $tenant) {
            $tenant->delete();
        }

        parent::tearDown();
    }

    private function criarTenant(string $id = 'demo'): Tenant
    {
        $tenant = Tenant::create(['id' => $id, 'nome' => "Prefeitura {$id}"]);
        $tenant->domains()->create(['domain' => "{$id}.localhost"]);

        // Cidades ficam no banco central.
        Cidade::insert([
            ['id_cidade' => 1, 'codigo' => '3550308', 'descricao' => 'São Paulo', 'uf' => 'SP'],
            ['id_cidade' => 2, 'codigo' => '3509502', 'descricao' => 'Campinas', 'uf' => 'SP'],
            ['id_cidade' => 3, 'codigo' => '3304557', 'descricao' => 'Rio de Janeiro', 'uf' => 'RJ'],
        ]);

        return $tenant;
    }

    /** Token de um usuário com as permissões de tela informadas. */
    private function entrar(array $permissoes = ['cadastros.clientes'], string $tenant = 'demo'): string
    {
        $user = User::factory()->create(['password' => 'senha']);
        $user->tenants()->attach($tenant);
        Tenant::find($tenant)->run(fn () => $user->givePermissionTo($permissoes));

        $token = $this->postJson("http://{$tenant}.localhost/api/login", [
            'cpf' => $user->cpf,
            'password' => 'senha',
        ])->assertOk()->json('token');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $token;
    }

    private function emDemo(string $token, string $metodo, string $url, array $dados = [])
    {
        $resposta = $this->withToken($token)->json($metodo, "http://demo.localhost{$url}", $dados);
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $resposta;
    }

    /** Corpo mínimo válido de pessoa física, com os campos do teste por cima. */
    private function pessoaFisica(array $campos = []): array
    {
        return array_replace_recursive([
            'tipo_pessoa' => 'F',
            'cpf_cnpj' => '529.982.247-25',
            'nome' => 'Maria Souza',
            'nome_fantasia' => null,
            'rg' => '12.345.678-9',
            'data_nascimento' => '1990-05-20',
            'endereco' => [
                'cep' => '01310-100',
                'logradouro' => 'Avenida Paulista',
                'numero' => '1000',
                'complemento' => 'Sala 1',
                'bairro' => 'Bela Vista',
                'cidade' => 1,
                'latitude' => -23.5613991,
                'longitude' => -46.6565712,
            ],
            'contato' => ['email' => 'maria@exemplo.com', 'telefone' => '(11) 3333-4444', 'celular' => '(11) 98888-7777'],
            'fiscal' => ['indicador_ie' => 9, 'inscricao_estadual' => null, 'inscricao_municipal' => null, 'consumidor_final' => true],
            'limite_credito' => 1500.5,
            'observacoes' => 'Prefere contato pelo celular.',
            'ativo' => true,
        ], $campos);
    }

    public function test_exige_a_permissao_da_tela(): void
    {
        $this->criarTenant();
        $token = $this->entrar(['cadastros.vendedores']);

        $this->emDemo($token, 'get', '/api/cadastros/clientes')->assertForbidden();
        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica())->assertForbidden();
        $this->emDemo($token, 'get', '/api/cadastros/clientes/cidades?uf=SP')->assertForbidden();
    }

    public function test_cadastra_lista_altera_e_exclui_pessoa_fisica(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $id = $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica())
            ->assertCreated()
            ->assertJsonPath('cpf_cnpj', '52998224725')
            ->assertJsonPath('endereco.cep', '01310100')
            ->assertJsonPath('endereco.cidade', ['id' => 1, 'nome' => 'São Paulo', 'uf' => 'SP'])
            ->assertJsonPath('endereco.latitude', -23.5613991)
            ->assertJsonPath('endereco.longitude', -46.6565712)
            ->assertJsonPath('contato.telefone', '1133334444')
            ->assertJsonPath('contato.celular', '11988887777')
            ->assertJsonPath('data_nascimento', '1990-05-20')
            ->assertJsonPath('limite_credito', '1500.50')
            ->json('id');

        $this->emDemo($token, 'get', '/api/cadastros/clientes')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nome', 'Maria Souza');

        $this->emDemo($token, 'put', "/api/cadastros/clientes/{$id}", $this->pessoaFisica([
            'nome' => 'Maria Souza Lima',
            'ativo' => false,
            'endereco' => ['cidade' => 2],
        ]))
            ->assertOk()
            ->assertJsonPath('nome', 'Maria Souza Lima')
            ->assertJsonPath('ativo', false)
            ->assertJsonPath('endereco.cidade.nome', 'Campinas');

        $this->emDemo($token, 'delete', "/api/cadastros/clientes/{$id}")->assertNoContent();
        Tenant::find('demo')->run(fn () => $this->assertSame(0, Cliente::count()));
    }

    public function test_pessoa_juridica_aceita_cnpj_alfanumerico_e_limpa_os_campos_de_pessoa_fisica(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica([
            'tipo_pessoa' => 'J',
            'cpf_cnpj' => '12.abc.345/01de-35',
            'nome' => 'Comércio Exemplo Ltda',
            'nome_fantasia' => 'Loja Exemplo',
            'fiscal' => ['indicador_ie' => 1, 'inscricao_estadual' => '110.042.490.114', 'consumidor_final' => false],
        ]))
            ->assertCreated()
            ->assertJsonPath('cpf_cnpj', '12ABC34501DE35')
            ->assertJsonPath('nome_fantasia', 'Loja Exemplo')
            ->assertJsonPath('rg', null)
            ->assertJsonPath('data_nascimento', null)
            ->assertJsonPath('fiscal.inscricao_estadual', '110.042.490.114')
            ->assertJsonPath('fiscal.consumidor_final', false);
    }

    public function test_pessoa_fisica_nao_guarda_nome_fantasia(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica(['nome_fantasia' => 'Apelido']))
            ->assertCreated()
            ->assertJsonPath('nome_fantasia', null);
    }

    public function test_recusa_documento_invalido_ou_repetido(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica(['cpf_cnpj' => '111.111.111-11']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cpf_cnpj' => 'Informe um CPF válido.']);

        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica(['tipo_pessoa' => 'J', 'cpf_cnpj' => '11.222.333/0001-00']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cpf_cnpj' => 'Informe um CNPJ válido.']);

        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica())->assertCreated();
        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica(['cpf_cnpj' => '52998224725']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cpf_cnpj' => 'Já existe um cliente com este CPF/CNPJ.']);
    }

    public function test_alterar_mantendo_o_proprio_documento_nao_acusa_repeticao(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $id = $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica())->json('id');

        $this->emDemo($token, 'put', "/api/cadastros/clientes/{$id}", $this->pessoaFisica())->assertOk();
    }

    public function test_inscricao_estadual_obrigatoria_so_para_contribuinte(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica([
            'fiscal' => ['indicador_ie' => 1, 'inscricao_estadual' => null],
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['fiscal.inscricao_estadual' => 'Informe a inscrição estadual do contribuinte.']);

        // Isento: a IE informada é descartada.
        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica([
            'fiscal' => ['indicador_ie' => 2, 'inscricao_estadual' => '123'],
        ]))
            ->assertCreated()
            ->assertJsonPath('fiscal.inscricao_estadual', null);
    }

    public function test_valida_os_demais_campos(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica([
            'nome' => '',
            'data_nascimento' => now()->addDay()->format('Y-m-d'),
            'endereco' => ['cep' => '123', 'cidade' => 999],
            'contato' => ['email' => 'nao-e-email', 'celular' => '1199999'],
            'fiscal' => ['indicador_ie' => 5],
            'limite_credito' => -1,
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'nome' => 'Informe o nome.',
                'data_nascimento' => 'A data de nascimento não pode ser futura.',
                'endereco.cep' => 'O CEP tem 8 dígitos.',
                'endereco.cidade' => 'Escolha uma cidade da lista.',
                'contato.email' => 'Informe um e-mail válido.',
                'contato.celular' => 'Informe o celular com DDD (11 dígitos).',
                'fiscal.indicador_ie' => 'Escolha o indicador da inscrição estadual.',
                'limite_credito' => 'O limite de crédito não pode ser negativo.',
            ]);
    }

    public function test_endereco_e_celular_sao_obrigatorios(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica([
            'endereco' => ['cep' => null, 'logradouro' => null, 'numero' => null, 'complemento' => null, 'bairro' => null, 'cidade' => null],
            'contato' => ['email' => null, 'telefone' => null, 'celular' => null],
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'endereco.cep' => 'Informe o CEP.',
                'endereco.logradouro' => 'Informe o logradouro.',
                'endereco.numero' => 'Informe o número (ou S/N).',
                'endereco.bairro' => 'Informe o bairro.',
                'endereco.cidade' => 'Escolha a cidade.',
                'contato.celular' => 'Informe o celular.',
            ])
            ->assertJsonMissingValidationErrors(['endereco.complemento', 'contato.email', 'contato.telefone']);
    }

    public function test_localizacao_e_opcional_mas_vem_em_par_e_dentro_da_faixa(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica([
            'endereco' => ['latitude' => null, 'longitude' => null],
        ]))->assertCreated()->assertJsonPath('endereco.latitude', null);

        $this->emDemo($token, 'post', '/api/cadastros/clientes', $this->pessoaFisica([
            'cpf_cnpj' => '111.444.777-35',
            'endereco' => ['latitude' => -95, 'longitude' => null],
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'endereco.latitude' => 'A latitude vai de -90 a 90.',
                'endereco.longitude' => 'Informe a longitude junto com a latitude.',
            ]);
    }

    public function test_lista_as_cidades_da_uf(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'get', '/api/cadastros/clientes/cidades?uf=sp')
            ->assertOk()
            ->assertExactJson(['data' => [
                ['id' => 2, 'codigo_ibge' => '3509502', 'nome' => 'Campinas'],
                ['id' => 1, 'codigo_ibge' => '3550308', 'nome' => 'São Paulo'],
            ]]);

        $this->emDemo($token, 'get', '/api/cadastros/clientes/cidades')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['uf' => 'Informe a UF.']);
    }

    public function test_seeder_cria_25_clientes_com_documentos_validos(): void
    {
        $this->criarTenant();

        Tenant::find('demo')->run(function () {
            $this->seed(ClienteSeeder::class);

            $this->assertSame(25, Cliente::count());
            $this->assertSame(10, Cliente::where('tipo_pessoa', 'J')->count());
            $this->assertSame(3, Cliente::where('ativo', false)->count());
            foreach (Cliente::all() as $cliente) {
                $this->assertTrue(
                    $cliente->tipo_pessoa === 'J' ? Cnpj::valido($cliente->cpf_cnpj) : Cpf::valido($cliente->cpf_cnpj),
                    "Documento inválido: {$cliente->cpf_cnpj}",
                );
            }
        });
    }
}
