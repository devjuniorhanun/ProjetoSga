<?php
namespace App\Services\Registrations\Agricultural\Defensive;
use App\Models\Registrations\Agricultural\Defensive\OperationDefensive;
class OperationDefensiveService { public function list(){return OperationDefensive::query()->orderBy('id')->get();} public function create(array $data): OperationDefensive{return OperationDefensive::create($data);} public function update(OperationDefensive $item,array $data): OperationDefensive{$item->update($data);return $item->refresh();} public function delete(OperationDefensive $item):void{$item->delete();} }
