<?php

namespace App\Http\Resources\Registrations\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'status' => $this->status ?? 'A',
            'role_ids' => $this->whenLoaded('roles', fn () => $this->roles->pluck('id')->values()),
            'role_names' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')->values()),
            'roles' => $this->whenLoaded('roles', fn () => RoleResource::collection($this->roles)),
        ];
    }
}
