<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_health_check_responds(): void
    {
        $this->get('/up')->assertOk();
    }

    public function test_central_status_endpoint_responds(): void
    {
        $this->getJson('http://localhost/api/status')
            ->assertOk()
            ->assertJson(['status' => 'ok']);
    }
}
