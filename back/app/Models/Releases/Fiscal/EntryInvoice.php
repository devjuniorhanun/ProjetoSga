<?php

namespace App\Models\Releases\Fiscal;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EntryInvoice extends Model
{
    use SoftDeletes;
    protected $guarded = [];
    protected function casts(): array { return ['issue_date'=>'date','entry_date'=>'date','confirmed_at'=>'datetime','canceled_at'=>'datetime']; }
    public function items() { return $this->hasMany(EntryInvoiceItem::class); }
    public function installments() { return $this->hasMany(EntryInvoiceInstallment::class); }
    public function freights() { return $this->hasMany(InvoiceFreight::class); }
}
