<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\Produto;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vendedor;
use App\Relatorios\Pdf\MotorDePdf;
use App\Support\Vendas;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Fakes\MotorFalso;
use Tests\TestCase;

class RelatorioDeVendasTest extends TestCase
{
    use RefreshDatabase;

    private const SETEMBRO = '/api/relatorios/vendas-periodo?inicio=2026-09-01&fim=2026-09-30';

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
    private function entrar(array $permissoes = ['relatorios.vendas_periodo'], string $tenant = 'demo'): string
    {
        $user = User::factory()->create(['password' => 'senha', 'name' => 'Fiscal Teste']);
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

    private function emDemo(string $token, string $url)
    {
        $resposta = $this->withToken($token)->getJson("http://demo.localhost{$url}");
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return $resposta;
    }

    /**
     * Setembro: Ana vende 100 (pix) e 200 − 20 de desconto (dinheiro); Beto vende 50 (pix) e tem
     * uma venda de 70 cancelada. Em outubro, Ana vende 999 (fora do período).
     *
     * @return array{ana: int, beto: int, cliente: int}
     */
    private function registrarVendas(): array
    {
        $ids = Tenant::find('demo')->run(function () {
            $ana = Vendedor::factory()->create(['nome' => 'Ana Lima', 'comissao_percentual' => 5]);
            $beto = Vendedor::factory()->create(['nome' => 'Beto Souza', 'comissao_percentual' => 2.5]);
            $maria = Cliente::factory()->create(['nome' => 'Maria Silva']);
            $jose = Cliente::factory()->create(['nome' => 'José Santos']);
            $produto = Produto::factory()->create(['controla_estoque' => false]);

            $vender = fn (string $data, Vendedor $vendedor, Cliente $cliente, string $forma, string $preco, string $desconto = '0.00') => Vendas::registrar([
                'data' => $data,
                'cliente' => $cliente->id_cliente,
                'vendedor' => $vendedor->id_vendedor,
                'forma_pagamento' => $forma,
                'desconto' => $desconto,
                'observacoes' => null,
                'itens' => [['produto' => $produto->id_produto, 'quantidade' => '1.000', 'preco_unitario' => $preco, 'desconto' => '0.00']],
            ]);

            $vender('2026-09-01', $ana, $maria, 'pix', '100.00');
            $vender('2026-09-10', $ana, $jose, 'dinheiro', '200.00', '20.00');
            $vender('2026-09-15', $beto, $maria, 'pix', '50.00');
            Vendas::cancelar($vender('2026-09-20', $beto, $jose, 'pix', '70.00'));
            $vender('2026-10-01', $ana, $maria, 'pix', '999.00');

            return ['ana' => $ana->id_vendedor, 'beto' => $beto->id_vendedor, 'cliente' => $maria->id_cliente];
        });
        tenancy()->end();

        return $ids;
    }

    public function test_exige_a_permissao_da_tela(): void
    {
        $this->criarTenant();
        $token = $this->entrar(['lancamentos.vendas']);

        $this->emDemo($token, self::SETEMBRO)->assertForbidden();
        $this->emDemo($token, '/api/relatorios/vendas-periodo/pdf?inicio=2026-09-01&fim=2026-09-30')->assertForbidden();
        $this->emDemo($token, '/api/relatorios/vendas-periodo/opcoes')->assertForbidden();
    }

    public function test_resume_o_periodo_por_pagamento_e_por_vendedor(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $ids = $this->registrarVendas();

        $this->emDemo($token, self::SETEMBRO)
            ->assertOk()
            ->assertJsonPath('resumo', [
                'quantidade' => 3,
                'subtotal' => '350.00',
                'descontos' => '20.00',
                'total' => '330.00',
                'ticket_medio' => '110.00',
                'canceladas' => ['quantidade' => 1, 'total' => '70.00'],
            ])
            ->assertJsonPath('por_pagamento', [
                ['forma_pagamento' => 'dinheiro', 'descricao' => 'Dinheiro', 'quantidade' => 1, 'total' => '180.00'],
                ['forma_pagamento' => 'pix', 'descricao' => 'Pix', 'quantidade' => 2, 'total' => '150.00'],
            ])
            ->assertJsonPath('por_vendedor', [
                ['id' => $ids['ana'], 'nome' => 'Ana Lima', 'quantidade' => 2, 'total' => '280.00', 'comissao_percentual' => '5.00', 'comissao' => '14.00'],
                ['id' => $ids['beto'], 'nome' => 'Beto Souza', 'quantidade' => 1, 'total' => '50.00', 'comissao_percentual' => '2.50', 'comissao' => '1.25'],
            ])
            // A lista vem em ordem de data, sem as canceladas.
            ->assertJsonCount(3, 'vendas')
            ->assertJsonPath('vendas.0.data', '2026-09-01')
            ->assertJsonPath('vendas.0.cliente.nome', 'Maria Silva')
            ->assertJsonPath('vendas.0.itens', 1)
            ->assertJsonPath('vendas.2.data', '2026-09-15');

        // Com as canceladas, a lista cresce, mas os totais não mudam.
        $this->emDemo($token, self::SETEMBRO.'&incluir_canceladas=1')
            ->assertJsonCount(4, 'vendas')
            ->assertJsonPath('vendas.3.situacao', 'cancelada')
            ->assertJsonPath('resumo.total', '330.00');
    }

    public function test_filtra_por_vendedor_cliente_e_forma_de_pagamento(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $ids = $this->registrarVendas();

        $this->emDemo($token, self::SETEMBRO."&vendedor={$ids['beto']}")
            ->assertJsonPath('resumo.quantidade', 1)
            ->assertJsonPath('resumo.total', '50.00')
            ->assertJsonPath('filtros.vendedor', ['id' => $ids['beto'], 'nome' => 'Beto Souza']);
        $this->emDemo($token, self::SETEMBRO.'&forma_pagamento=pix')
            ->assertJsonPath('resumo.quantidade', 2)
            ->assertJsonPath('resumo.total', '150.00');
        $this->emDemo($token, self::SETEMBRO."&cliente={$ids['cliente']}")
            ->assertJsonPath('resumo.quantidade', 2)
            ->assertJsonPath('resumo.total', '150.00');
        // Período sem vendas: tudo zerado, sem erro de divisão.
        $this->emDemo($token, '/api/relatorios/vendas-periodo?inicio=2026-01-01&fim=2026-01-31')
            ->assertOk()
            ->assertJsonPath('resumo.quantidade', 0)
            ->assertJsonPath('resumo.ticket_medio', '0.00')
            ->assertJsonPath('vendas', []);
    }

    public function test_valida_o_periodo(): void
    {
        $this->criarTenant();
        $token = $this->entrar();

        $this->emDemo($token, '/api/relatorios/vendas-periodo')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['inicio' => 'Informe a data inicial.', 'fim' => 'Informe a data final.']);
        $this->emDemo($token, '/api/relatorios/vendas-periodo?inicio=2026-09-30&fim=2026-09-01')
            ->assertJsonValidationErrors(['fim' => 'A data final não pode ser antes da inicial.']);
        $this->emDemo($token, '/api/relatorios/vendas-periodo?inicio=2026-01-01&fim=2027-01-02')
            ->assertJsonValidationErrors(['fim' => 'O período vai até 366 dias.']);
        $this->emDemo($token, '/api/relatorios/vendas-periodo?inicio=2026-01-01&fim=2026-12-31')->assertOk();
        $this->emDemo($token, '/api/relatorios/vendas-periodo?inicio=01/09/2026&fim=2026-09-30&forma_pagamento=cheque')
            ->assertJsonValidationErrors([
                'inicio' => 'Informe uma data válida.',
                'forma_pagamento' => 'Forma de pagamento desconhecida.',
            ]);
    }

    public function test_exporta_o_pdf_com_o_mpdf(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $this->registrarVendas();

        $resposta = $this->emDemo($token, '/api/relatorios/vendas-periodo/pdf?inicio=2026-09-01&fim=2026-09-30')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('Content-Disposition', 'attachment; filename="vendas-2026-09-01-a-2026-09-30.pdf"');

        $this->assertStringStartsWith('%PDF-', $resposta->getContent());
    }

    public function test_o_pdf_passa_pela_fachada(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        $this->registrarVendas();
        $motor = new MotorFalso;
        $this->app->instance(MotorDePdf::class, $motor);

        $this->emDemo($token, '/api/relatorios/vendas-periodo/pdf?inicio=2026-09-01&fim=2026-09-30&incluir_canceladas=1')
            ->assertOk();

        $this->assertSame('paisagem', $motor->opcoes->orientacao);
        $this->assertStringContainsString('Prefeitura demo', $motor->opcoes->cabecalho);
        $this->assertStringContainsString('01/09/2026 a 30/09/2026', $motor->opcoes->cabecalho);
        $this->assertStringContainsString('por Fiscal Teste', $motor->opcoes->rodape);
        $this->assertStringContainsString('Página {pagina} de {paginas}', $motor->opcoes->rodape);
        $this->assertStringContainsString('Maria Silva', $motor->html);
        $this->assertStringContainsString('R$ 330,00', $motor->html);
        $this->assertStringContainsString('Cancelada', $motor->html);
        $this->assertStringContainsString('R$ 14,00', $motor->html);
    }

    public function test_opcoes_trazem_inclusive_os_inativos(): void
    {
        $this->criarTenant();
        $token = $this->entrar();
        Tenant::find('demo')->run(function () {
            Vendedor::factory()->create(['nome' => 'Ativo']);
            Vendedor::factory()->inativo()->create(['nome' => 'Inativo']);
            Cliente::factory()->inativo()->create(['nome' => 'Cliente Antigo']);
        });
        tenancy()->end();

        $this->emDemo($token, '/api/relatorios/vendas-periodo/opcoes')
            ->assertOk()
            ->assertJsonCount(6, 'formas_de_pagamento')
            ->assertJsonPath('vendedores.*.nome', ['Ativo', 'Inativo'])
            ->assertJsonPath('clientes.0.nome', 'Cliente Antigo');
    }
}
