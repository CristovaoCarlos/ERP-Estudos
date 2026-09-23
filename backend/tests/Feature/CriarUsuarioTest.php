<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CriarUsuarioTest extends TestCase
{
    use RefreshDatabase;

    public function test_cria_usuario_com_cpf_sem_mascara(): void
    {
        $this->artisan('usuarios:criar', [
            'email' => 'maria@exemplo.com',
            'nome' => 'Maria',
            '--cpf' => '529.982.247-25',
            '--senha' => 'segredo',
        ])->assertSuccessful();

        $this->assertSame('52998224725', User::where('email', 'maria@exemplo.com')->value('cpf'));
    }

    public function test_preenche_o_cpf_de_usuario_antigo(): void
    {
        User::factory()->create(['email' => 'maria@exemplo.com', 'cpf' => null]);

        $this->artisan('usuarios:criar', [
            'email' => 'maria@exemplo.com',
            'nome' => 'Maria',
            '--cpf' => '52998224725',
            '--senha' => 'segredo',
        ])->assertSuccessful();

        $this->assertSame(1, User::count());
        $this->assertSame('52998224725', User::first()->cpf);
    }

    public function test_recusa_cpf_invalido(): void
    {
        $this->artisan('usuarios:criar', [
            'email' => 'maria@exemplo.com',
            'nome' => 'Maria',
            '--cpf' => '11111111111',
            '--senha' => 'segredo',
        ])->assertFailed();

        $this->assertSame(0, User::count());
    }

    public function test_recusa_cpf_de_outro_usuario(): void
    {
        User::factory()->create(['email' => 'joao@exemplo.com', 'cpf' => '52998224725']);

        $this->artisan('usuarios:criar', [
            'email' => 'maria@exemplo.com',
            'nome' => 'Maria',
            '--cpf' => '52998224725',
            '--senha' => 'segredo',
        ])->assertFailed();
    }

    public function test_marca_superadmin_e_da_grupos_na_prefeitura(): void
    {
        $tenant = Tenant::create(['id' => 'lemarq']);

        try {
            $this->artisan('usuarios:criar', [
                'email' => 'maria@exemplo.com',
                'nome' => 'Maria',
                '--cpf' => '52998224725',
                '--senha' => 'segredo',
                '--tenant' => ['lemarq'],
                '--grupo' => ['Parâmetros', 'Tabelas'],
                '--superadmin' => true,
            ])->assertSuccessful();

            $user = User::first();
            $this->assertTrue($user->superadmin);
            $tenant->run(fn () => $this->assertEqualsCanonicalizing(
                ['Parâmetros', 'Tabelas'],
                $user->getRoleNames()->all(),
            ));
        } finally {
            $tenant->delete();
        }
    }

    public function test_recusa_grupo_inexistente(): void
    {
        $tenant = Tenant::create(['id' => 'lemarq']);

        try {
            $this->artisan('usuarios:criar', [
                'email' => 'maria@exemplo.com',
                'nome' => 'Maria',
                '--cpf' => '52998224725',
                '--senha' => 'segredo',
                '--tenant' => ['lemarq'],
                '--grupo' => ['Fiscalização'],
            ])->assertFailed();
        } finally {
            $tenant->delete();
        }
    }

    public function test_grupo_exige_tenant(): void
    {
        $this->artisan('usuarios:criar', [
            'email' => 'maria@exemplo.com',
            'nome' => 'Maria',
            '--cpf' => '52998224725',
            '--senha' => 'segredo',
            '--grupo' => ['Tabelas'],
        ])->assertFailed();
    }
}
