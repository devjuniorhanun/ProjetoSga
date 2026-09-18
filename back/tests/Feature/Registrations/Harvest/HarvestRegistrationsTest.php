<?php

namespace Tests\Feature\Registrations\Harvest;

use App\Models\Registrations\Admin\Role;
use App\Models\Registrations\Admin\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HarvestRegistrationsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): void
    {
        $role = Role::create(['name' => 'Administrador', 'abbreviation' => 'ADM', 'status' => 'A']);
        $user = User::create(['name' => 'Teste', 'email' => 'teste@example.com', 'password' => 'password', 'status' => 'A']);
        $user->roles()->attach($role);
        Sanctum::actingAs($user);
    }

    public function test_can_create_agricultural_year_and_culture(): void
    {
        $this->admin();
        $this->postJson('/api/registrations/harvest/agricultural-years', ['name'=>'2026/2027','opening_date'=>'2026-09-01','closing_date'=>'2027-08-31'])->assertCreated();
        $this->postJson('/api/registrations/harvest/cultures', ['name'=>'Soja'])->assertCreated();
    }

    public function test_can_create_crop_with_many_to_many_cultures(): void
    {
        $this->admin();
        $year = $this->postJson('/api/registrations/harvest/agricultural-years', ['name'=>'2026/2027','opening_date'=>'2026-09-01','closing_date'=>'2027-08-31'])->json('data.id');
        $c1 = $this->postJson('/api/registrations/harvest/cultures', ['name'=>'Soja'])->json('data.id');
        $c2 = $this->postJson('/api/registrations/harvest/cultures', ['name'=>'Milho'])->json('data.id');
        $this->postJson('/api/registrations/harvest/crops', ['agricultural_year_id'=>$year,'name'=>'Safra Verão','opening_date'=>'2026-09-01','closing_date'=>'2027-02-28','culture_ids'=>[$c1,$c2]])->assertCreated()->assertJsonPath('data.culture_ids.0',$c1);
    }
}
