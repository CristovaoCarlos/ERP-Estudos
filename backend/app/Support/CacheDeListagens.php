<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Listagens das telas (vendas, clientes, produtos, vendedores) guardadas no cache (Redis) por 5
 * minutos, já no formato da API, para não ir ao banco a cada abertura da tela. Quem altera os dados
 * chama `esquecer` e a próxima consulta lê do banco; a validade só cobre o que escapar disso.
 *
 * As chaves não levam a prefeitura: o `CacheTenancyBootstrapper` já marca cada chave com a tag
 * `tenant_<id>`, e uma prefeitura não enxerga o cache da outra.
 */
class CacheDeListagens
{
    public const VENDAS = 'vendas';

    public const CLIENTES = 'clientes';

    public const PRODUTOS = 'produtos';

    public const VENDEDORES = 'vendedores';

    /** Validade de cada listagem no cache, em segundos. */
    public const VALIDADE = 300;

    /**
     * A listagem do cache ou, se não houver, o resultado de `$consulta`, que fica guardado.
     *
     * @param  Closure(): array<mixed>  $consulta
     * @return array<mixed>
     */
    public static function lembrar(string $listagem, Closure $consulta): array
    {
        return Cache::remember(self::chave($listagem), self::VALIDADE, $consulta);
    }

    /** Tira as listagens do cache da prefeitura atual. */
    public static function esquecer(string ...$listagens): void
    {
        foreach ($listagens as $listagem) {
            Cache::forget(self::chave($listagem));
        }
    }

    public static function chave(string $listagem): string
    {
        return "listagens.{$listagem}";
    }
}
