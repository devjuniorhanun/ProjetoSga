<?php

namespace Database\Seeders;

use App\Models\Registrations\Admin\Permission;
use App\Models\Registrations\Admin\Role;
use Illuminate\Database\Seeder;

class FiscalInventoryServicePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $names = [
            'inventory.stock.view','inventory.stock.manage','inventory.output.create','inventory.output.confirm','inventory.audit.view',
            'fiscal.invoice.view','fiscal.invoice.create','fiscal.invoice.update','fiscal.invoice.confirm','fiscal.invoice.delete','fiscal.invoice.import_xml',
            'fiscal.return.create','fiscal.return.confirm','freight.rate.manage','freight.view','freight.payment.create',
            'agricultural.service.view','agricultural.service.create','agricultural.service.update','agricultural.service.complete',
            'agricultural.seed_treatment.view','agricultural.seed_treatment.create','agricultural.seed_treatment.complete','agricultural.firebreak.manage',
            'harvest.release.manage','harvest.advance.view','harvest.advance.create',
        ];
        $ids=collect($names)->map(fn(string$name)=>Permission::firstOrCreate(['name'=>$name])->id);
        Role::query()->whereIn('abbreviation',['SUPER','ADM'])->get()->each(fn(Role$role)=>$role->permissions()->syncWithoutDetaching($ids));
    }
}
