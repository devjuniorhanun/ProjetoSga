<?php

namespace Database\Seeders;

use App\Models\Registrations\Admin\Permission;
use App\Models\Registrations\Admin\Role;
use Illuminate\Database\Seeder;

class GrainPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'grain.scale.view', 'grain.scale.manage', 'grain.weighing.create',
            'grain.weighing.capture', 'grain.weighing.manual.request',
            'grain.weighing.manual.authorize', 'grain.weighing.cancel.request',
            'grain.weighing.cancel.authorize', 'grain.receipt.create',
            'grain.receipt.close', 'grain.receipt.print', 'grain.discount.inform',
            'grain.discount.extra.request', 'grain.discount.extra.authorize',
            'grain.discount.closed.change', 'grain.impurity.create',
            'grain.impurity.manual.request', 'grain.impurity.manual.authorize',
            'grain.impurity.cancel', 'grain.impurity.print', 'grain.stock.view',
            'grain.stock.adjust.request', 'grain.stock.adjust.authorize',
            'grain.contract.create', 'grain.contract.update.request',
            'grain.contract.update.authorize', 'grain.contract.suspend',
            'grain.contract.reopen', 'grain.contract.cancel', 'grain.balance.transfer',
            'grain.balance.transfer.reverse', 'grain.balance.assignment.request',
            'grain.balance.assignment.authorize', 'grain.shipment.create',
            'grain.shipment.close', 'grain.shipment.multiple_contracts.authorize',
            'grain.shipment.print', 'grain.technical_loss.view',
            'grain.technical_loss.configure', 'grain.technical_loss.process',
            'grain.technical_loss.reverse', 'grain.audit.view',
        ];

        $ids = collect($permissions)
            ->map(fn (string $name) => Permission::firstOrCreate(['name' => $name])->id)
            ->all();

        Role::query()->whereIn('abbreviation', ['SUPER', 'ADM'])->get()
            ->each(fn (Role $role) => $role->permissions()->syncWithoutDetaching($ids));

        $operatorPermissions = Permission::query()->whereIn('name', [
            'grain.scale.view', 'grain.weighing.create', 'grain.weighing.capture',
            'grain.weighing.manual.request', 'grain.weighing.cancel.request',
            'grain.receipt.create', 'grain.receipt.close', 'grain.receipt.print',
            'grain.discount.inform', 'grain.discount.extra.request',
            'grain.impurity.create', 'grain.impurity.manual.request', 'grain.impurity.print',
            'grain.stock.view', 'grain.shipment.create', 'grain.shipment.close', 'grain.shipment.print',
        ])->pluck('id');
        Role::query()->where('abbreviation', 'BAL')->first()?->permissions()->syncWithoutDetaching($operatorPermissions);
    }
}
