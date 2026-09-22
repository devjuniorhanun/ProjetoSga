<?php

namespace App\Models\Releases\Fiscal;

use Illuminate\Database\Eloquent\Model;

class EntryInvoiceItem extends Model
{
    protected $guarded = [];
    public function allocations() { return $this->hasMany(EntryInvoiceStockAllocation::class); }
    public function seedLots() { return $this->hasMany(EntryInvoiceSeedLot::class); }
}
