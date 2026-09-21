<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $app = parent::createApplication();

        // RefreshDatabase e a exclusão de tenants apagam bancos: nunca rodar fora do SQLite.
        if ($app['config']->get('database.default') !== 'sqlite') {
            throw new RuntimeException('Testes devem rodar em SQLite; conexão atual: '.$app['config']->get('database.default'));
        }

        return $app;
    }
}
