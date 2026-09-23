<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Notifications\RedefinirSenha;
use App\Support\Cpf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class SenhaTest extends TestCase
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

    private function criarTenant(string $id): Tenant
    {
        $tenant = Tenant::create(['id' => $id, 'nome' => "Prefeitura de {$id}"]);
        $tenant->domains()->create(['domain' => "{$id}.localhost"]);

        return $tenant;
    }

    private function criarUsuario(string $tenant = 'lemarq', bool $ativo = true): User
    {
        $user = User::factory()->create([
            'name' => 'Maria Souza',
            'cpf' => '52998224725',
            'email' => 'maria@exemplo.com',
            'password' => 'senha-antiga',
        ]);
        $user->tenants()->attach($tenant, ['ativo' => $ativo]);

        return $user;
    }

    private function pedir(string $cpf = '529.982.247-25', string $tenant = 'lemarq')
    {
        $resposta = $this->postJson("http://{$tenant}.localhost/api/senha/esqueci", ['cpf' => $cpf]);
        tenancy()->end();

        return $resposta;
    }

    public function test_envia_o_email_com_o_link_da_prefeitura(): void
    {
        Notification::fake();
        $this->criarTenant('lemarq');
        $user = $this->criarUsuario();

        $this->pedir()
            ->assertOk()
            ->assertJsonPath('message', 'Se o CPF estiver cadastrado nesta prefeitura, enviamos um e-mail com o link para redefinir a senha.');

        Notification::assertSentTo($user, RedefinirSenha::class, function (RedefinirSenha $aviso) use ($user) {
            $mail = $aviso->toMail($user);
            $url = $mail->actionUrl;

            return str_starts_with($url, 'http://lemarq.localhost/redefinir-senha?')
                && str_contains($url, 'cpf=52998224725')
                && str_contains($mail->subject, 'Prefeitura de lemarq');
        });
    }

    public function test_cpf_desconhecido_responde_igual_e_nao_envia_email(): void
    {
        Notification::fake();
        $this->criarTenant('lemarq');

        $this->pedir()->assertOk();

        Notification::assertNothingSent();
    }

    public function test_usuario_de_outra_prefeitura_ou_desativado_nao_recebe_email(): void
    {
        Notification::fake();
        $this->criarTenant('lemarq');
        $this->criarTenant('outra');
        $this->criarUsuario('outra');

        $this->pedir()->assertOk();
        Notification::assertNothingSent();

        User::query()->delete();
        $this->criarUsuario('lemarq', ativo: false);

        $this->pedir()->assertOk();
        Notification::assertNothingSent();
    }

    public function test_cpf_invalido_e_recusado(): void
    {
        $this->criarTenant('lemarq');

        $this->pedir('111.111.111-11')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cpf' => 'Informe um CPF válido.']);
    }

    public function test_redefine_a_senha_com_o_token_e_derruba_as_sessoes(): void
    {
        $this->criarTenant('lemarq');
        $user = $this->criarUsuario();
        $token = Password::createToken($user);
        $sessao = $user->createToken('web:lemarq')->plainTextToken;

        $this->postJson('http://lemarq.localhost/api/senha/redefinir', [
            'cpf' => '529.982.247-25',
            'token' => $token,
            'password' => 'senha-nova-forte',
            'password_confirmation' => 'senha-nova-forte',
        ])->assertOk()->assertJsonPath('message', 'Senha alterada. Entre com a senha nova.');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $this->assertTrue(Hash::check('senha-nova-forte', $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
        $this->withToken($sessao)->getJson('http://lemarq.localhost/api/me')->assertUnauthorized();
        tenancy()->end();

        $this->postJson('http://lemarq.localhost/api/login', [
            'cpf' => '529.982.247-25',
            'password' => 'senha-nova-forte',
        ])->assertOk();
    }

    public function test_token_usado_duas_vezes_e_recusado(): void
    {
        $this->criarTenant('lemarq');
        $user = $this->criarUsuario();
        $token = Password::createToken($user);
        $dados = [
            'cpf' => '52998224725',
            'token' => $token,
            'password' => 'senha-nova-forte',
            'password_confirmation' => 'senha-nova-forte',
        ];

        $this->postJson('http://lemarq.localhost/api/senha/redefinir', $dados)->assertOk();
        tenancy()->end();

        $this->postJson('http://lemarq.localhost/api/senha/redefinir', $dados)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['token' => 'Link inválido ou expirado. Peça um novo.']);
    }

    public function test_token_de_outro_usuario_e_recusado(): void
    {
        $this->criarTenant('lemarq');
        $this->criarUsuario();
        $outro = User::factory()->create(['cpf' => Cpf::gerar()]);
        $outro->tenants()->attach('lemarq');

        $this->postJson('http://lemarq.localhost/api/senha/redefinir', [
            'cpf' => '52998224725',
            'token' => Password::createToken($outro),
            'password' => 'senha-nova-forte',
            'password_confirmation' => 'senha-nova-forte',
        ])->assertUnprocessable()->assertJsonValidationErrors(['token']);
    }

    public function test_senha_curta_ou_sem_confirmacao_e_recusada(): void
    {
        $this->criarTenant('lemarq');
        $user = $this->criarUsuario();
        $token = Password::createToken($user);

        $this->postJson('http://lemarq.localhost/api/senha/redefinir', [
            'cpf' => '52998224725',
            'token' => $token,
            'password' => 'curta',
            'password_confirmation' => 'curta',
        ])->assertJsonValidationErrors(['password']);
        tenancy()->end();

        $this->postJson('http://lemarq.localhost/api/senha/redefinir', [
            'cpf' => '52998224725',
            'token' => $token,
            'password' => 'senha-nova-forte',
            'password_confirmation' => 'outra-coisa',
        ])->assertJsonValidationErrors(['password']);
    }

    public function test_pedidos_seguidos_sao_limitados(): void
    {
        Notification::fake();
        $this->criarTenant('lemarq');
        $this->criarUsuario();

        for ($i = 0; $i < 5; $i++) {
            $this->pedir()->assertOk();
        }

        $this->pedir()->assertTooManyRequests();
    }
}
