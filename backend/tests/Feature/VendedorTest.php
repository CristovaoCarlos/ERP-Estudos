<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Vendedor;
use App\Support\Cpf;
use Database\Seeders\VendedorSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendedorTest extends TestCase
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

        return $tenant;
    }

    /** Token de um usuário com as permissões de tela informadas. */
    private function entrar(array $permissoes = ['cadastros.vendedores'], string $tenant = 'demo'): string
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

    /** Corpo válido, com os campos do teste por cima. */
    private function vendedor(array $campos = []): array
    {
        return array_replace_recursive([
            'nome' => 'João Pereira',
            'cpf' => '529.982.247-25',
            'data_admissao' => '2024-03-01',
            'contato' => ['email' => 'joao@exemplo.com', 'celular' => '(11) 98888-7777', 'telefone' => null],
            'comercial' => ['comissao' => 3.5, 'meta_mensal' => 50000, 'regiao' => 'Zona Sul'],
            'observacoes' => null,
            'ativo' => true,
        ], $campos);
    }

    public function test_exige_a_permissao_da_tela(): void
    {
        $this->criarTenant();
        $token = $this->entrar(['cadastros.clientes']);

        $this->emDemo($token, 'get', '/api/cadastros/vendedores')->assertForbidden();
        $this->emDemo($token, 'post', '/api/cadastros/vendedores', $this->vendedor())->assertForbidden();
        $this->emDemo($token, 'get', '/api/cadastros/vendedores/regioes')->assertForbidden();
    }

    public function test_cadastra_lista_altera_e_exclui(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $id = $this->emDemo($token, 'post', '/api/cadastros/vendedores', $this->vendedor())
            ->assertCreated()
            ->assertJsonPath('cpf', '52998224725')
            ->assertJsonPath('contato.celular', '11988887777')
            ->assertJsonPath('comercial.comissao', '3.50')
            ->assertJsonPath('comercial.meta_mensal', '50000.00')
            ->assertJsonPath('data_admissao', '2024-03-01')
            ->json('id');

        $this->emDemo($token, 'get', '/api/cadastros/vendedores')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nome', 'João Pereira');

        $this->emDemo($token, 'put', "/api/cadastros/vendedores/{$id}", $this->vendedor([
            'nome' => 'João Pereira Lima',
            'ativo' => false,
        ]))
            ->assertOk()
            ->assertJsonPath('nome', 'João Pereira Lima')
            ->assertJsonPath('ativo', false);

        $this->emDemo($token, 'delete', "/api/cadastros/vendedores/{$id}")->assertNoContent();
        Tenant::find('demo')->run(fn () => $this->assertSame(0, Vendedor::count()));
    }

    public function test_recusa_cpf_invalido_ou_repetido(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/cadastros/vendedores', $this->vendedor(['cpf' => '111.111.111-11']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cpf' => 'Informe um CPF válido.']);

        $id = $this->emDemo($token, 'post', '/api/cadastros/vendedores', $this->vendedor())->json('id');
        $this->emDemo($token, 'post', '/api/cadastros/vendedores', $this->vendedor())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cpf' => 'Já existe um vendedor com este CPF.']);

        // O próprio CPF não conta como repetido na alteração.
        $this->emDemo($token, 'put', "/api/cadastros/vendedores/{$id}", $this->vendedor())->assertOk();
    }

    public function test_valida_os_demais_campos(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, 'post', '/api/cadastros/vendedores', $this->vendedor([
            'nome' => '',
            'data_admissao' => now()->addDay()->format('Y-m-d'),
            'contato' => ['email' => 'x', 'celular' => null],
            'comercial' => ['comissao' => 120, 'meta_mensal' => -1],
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'nome' => 'Informe o nome.',
                'data_admissao' => 'A data de admissão não pode ser futura.',
                'contato.email' => 'Informe um e-mail válido.',
                'contato.celular' => 'Informe o celular.',
                'comercial.comissao' => 'A comissão vai de 0 a 100%.',
                'comercial.meta_mensal' => 'A meta não pode ser negativa.',
            ]);
    }

    public function test_regioes_trazem_as_ja_usadas(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $this->emDemo($token, 'post', '/api/cadastros/vendedores', $this->vendedor());
        $this->emDemo($token, 'post', '/api/cadastros/vendedores', $this->vendedor([
            'cpf' => '111.444.777-35', 'comercial' => ['regiao' => 'Centro'],
        ]));

        $this->emDemo($token, 'get', '/api/cadastros/vendedores/regioes')
            ->assertOk()
            ->assertExactJson(['data' => ['Centro', 'Zona Sul']]);
    }

    public function test_seeder_cria_10_vendedores_validos(): void
    {
        $this->criarTenant();

        Tenant::find('demo')->run(function () {
            $this->seed(VendedorSeeder::class);

            $this->assertSame(10, Vendedor::count());
            $this->assertSame(1, Vendedor::where('ativo', false)->count());
            foreach (Vendedor::pluck('cpf') as $cpf) {
                $this->assertTrue(Cpf::valido($cpf), "CPF inválido: {$cpf}");
            }
        });
    }
}
