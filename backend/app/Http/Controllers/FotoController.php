<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Foto do usuário. O arquivo tem nome aleatório e é servido por esta rota (a pasta `public` do
 * nginx não enxerga o storage), então o endereço da foto é a credencial para vê-la.
 */
class FotoController extends Controller
{
    private const DISCO = 'fotos';

    public function enviar(Request $request): JsonResponse
    {
        $request->validate([
            'foto' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048', 'dimensions:max_width=4000,max_height=4000'],
        ], [
            'foto.max' => 'A foto deve ter no máximo 2 MB.',
            'foto.mimes' => 'Use uma imagem JPEG, PNG ou WebP.',
        ]);

        $user = $request->user();
        $arquivo = Str::random(40).'.'.$request->file('foto')->extension();

        Storage::disk(self::DISCO)->putFileAs('', $request->file('foto'), $arquivo);
        $this->apagarAnterior($user);
        $user->update(['foto' => $arquivo]);

        return response()->json(['foto' => '/api/fotos/'.$arquivo]);
    }

    public function remover(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->apagarAnterior($user);
        $user->update(['foto' => null]);

        return response()->json(['foto' => null]);
    }

    /** Sem autenticação: o nome aleatório do arquivo é o segredo. */
    public function mostrar(string $arquivo): StreamedResponse
    {
        abort_unless(preg_match('/^[A-Za-z0-9]{40}\.(jpe?g|png|webp)$/', $arquivo), 404);
        abort_unless(Storage::disk(self::DISCO)->exists($arquivo), 404);

        return Storage::disk(self::DISCO)->response($arquivo, headers: [
            'Cache-Control' => 'private, max-age=86400',
        ]);
    }

    private function apagarAnterior(User $user): void
    {
        if ($user->foto) {
            Storage::disk(self::DISCO)->delete($user->foto);
        }
    }
}
