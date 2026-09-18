<?php
namespace App\Models\Releases\Fiscal;
use Illuminate\Database\Eloquent\Model;
class EntryInvoiceInstallment extends Model { protected $guarded=[]; protected function casts(): array{return ['due_date'=>'date'];} }
