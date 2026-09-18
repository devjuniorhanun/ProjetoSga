<?php
namespace App\Http\Resources\Registrations\Agricultural\Defensive;
use Illuminate\Http\Resources\Json\JsonResource;
class OperationDefensiveResource extends JsonResource { public function toArray($request): array { return ['id'=>$this->id,'name'=>$this->name,'status'=>$this->status]; } }
