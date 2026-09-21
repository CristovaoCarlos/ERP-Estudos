<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserBelongsToTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->acessaTenant(tenant('id')), 403, 'Sem acesso a esta prefeitura.');

        return $next($request);
    }
}
