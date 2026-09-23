<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FotoTest extends TestCase
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
        $tenant = Tenant::create(['id' => $id, 'nome' => "Prefeitura {$id}"]);
        $tenant->domains()->create(['domain' => "{$id}.localhost"]);

        return $tenant;
    }

    private function entrar(string $tenant = 'lemarq'): array
    {
        $user = User::factory()->create(['password' => 'senha']);
        $user->tenants()->attach($tenant);

        $token = $this->postJson("http://{$tenant}.localhost/api/login", [
            'cpf' => $user->cpf,
            'password' => 'senha',
        ])->assertOk()->json('token');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        return [$user, $token];
    }

    public function test_envia_a_foto_e_a_serve_pelo_endereco_devolvido(): void
    {
        Storage::fake('fotos');
        $this->criarTenant('lemarq');
        [$user, $token] = $this->entrar();

        $foto = $this->withToken($token)->post('http://lemarq.localhost/api/me/foto', [
            'foto' => UploadedFile::fake()->image('retrato.jpg', 200, 200),
        ])->assertOk()->json('foto');
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $arquivo = $user->fresh()->foto;
        $this->assertSame("/api/fotos/{$arquivo}", $foto);
        Storage::disk('fotos')->assertExists($arquivo);

        // A foto vai junto do usuário, em qualquer prefeitura.
        $this->withToken($token)->getJson('http://lemarq.localhost/api/me')
            ->assertJsonPath('foto', $foto);
        tenancy()->end();

        // Servida sem autenticação: o nome aleatório do arquivo é o segredo.
        $this->get("http://lemarq.localhost{$foto}")->assertOk();
    }

    public function test_trocar_a_foto_apaga_a_anterior(): void
    {
        Storage::fake('fotos');
        $this->criarTenant('lemarq');
        [$user, $token] = $this->entrar();

        $this->withToken($token)->post('http://lemarq.localhost/api/me/foto', [
            'foto' => UploadedFile::fake()->image('antiga.png'),
        ])->assertOk();
        tenancy()->end();
        $this->app['auth']->forgetGuards();
        $antiga = $user->fresh()->foto;

        $this->withToken($token)->post('http://lemarq.localhost/api/me/foto', [
            'foto' => UploadedFile::fake()->image('nova.png'),
        ])->assertOk();
        tenancy()->end();

        Storage::disk('fotos')->assertMissing($antiga);
        Storage::disk('fotos')->assertExists($user->fresh()->foto);
    }

    public function test_remove_a_foto(): void
    {
        Storage::fake('fotos');
        $this->criarTenant('lemarq');
        [$user, $token] = $this->entrar();
        $this->withToken($token)->post('http://lemarq.localhost/api/me/foto', [
            'foto' => UploadedFile::fake()->image('retrato.jpg'),
        ])->assertOk();
        tenancy()->end();
        $this->app['auth']->forgetGuards();
        $arquivo = $user->fresh()->foto;

        $this->withToken($token)->deleteJson('http://lemarq.localhost/api/me/foto')
            ->assertOk()
            ->assertJsonPath('foto', null);
        tenancy()->end();

        $this->assertNull($user->fresh()->foto);
        Storage::disk('fotos')->assertMissing($arquivo);
    }

    public function test_recusa_arquivo_grande_ou_que_nao_e_imagem(): void
    {
        Storage::fake('fotos');
        $this->criarTenant('lemarq');
        [, $token] = $this->entrar();

        $this->withToken($token)->post('http://lemarq.localhost/api/me/foto', [
            'foto' => UploadedFile::fake()->create('documento.pdf', 100, 'application/pdf'),
        ])->assertUnprocessable()->assertJsonValidationErrors(['foto']);
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->post('http://lemarq.localhost/api/me/foto', [
            'foto' => UploadedFile::fake()->image('enorme.jpg')->size(3000),
        ])->assertJsonValidationErrors(['foto' => 'A foto deve ter no máximo 2 MB.']);
    }

    public function test_arquivo_inexistente_ou_nome_invalido_responde_404(): void
    {
        Storage::fake('fotos');
        $this->criarTenant('lemarq');

        $this->get('http://lemarq.localhost/api/fotos/../../.env')->assertNotFound();
        $this->get('http://lemarq.localhost/api/fotos/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg')
            ->assertNotFound();
    }

    public function test_enviar_foto_exige_sessao(): void
    {
        Storage::fake('fotos');
        $this->criarTenant('lemarq');

        $this->postJson('http://lemarq.localhost/api/me/foto')->assertUnauthorized();
    }
}
