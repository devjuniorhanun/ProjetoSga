<?php

namespace App\Services\Registrations\Agricultural\Defensive;

use App\Models\Registrations\Agricultural\Defensive\AgriculturalProduct;
use Illuminate\Support\Facades\DB;

class AgriculturalProductService
{
    public function list()
    {
        return AgriculturalProduct::query()
            ->with(['product', 'typeFormulation', 'activeIngredients'])
            ->orderBy('id')
            ->get();
    }

    public function create(array $data): AgriculturalProduct
    {
        return DB::transaction(function () use ($data): AgriculturalProduct {
            $activeIngredients = $data['active_ingredient'];
            unset($data['active_ingredient']);

            $item = AgriculturalProduct::create($data);
            $item->activeIngredients()->createMany($activeIngredients);

            return $item->load(['product', 'typeFormulation', 'activeIngredients']);
        });
    }

    public function update(AgriculturalProduct $item, array $data): AgriculturalProduct
    {
        return DB::transaction(function () use ($item, $data): AgriculturalProduct {
            $activeIngredients = $data['active_ingredient'];
            unset($data['active_ingredient']);

            $item->update($data);
            $item->activeIngredients()->delete();
            $item->activeIngredients()->createMany($activeIngredients);

            return $item->refresh()->load(['product', 'typeFormulation', 'activeIngredients']);
        });
    }

    public function delete(AgriculturalProduct $item): void
    {
        DB::transaction(function () use ($item): void {
            $item->activeIngredients()->delete();
            $item->delete();
        });
    }
}
