<?php
namespace App\Models\Releases\Fiscal;
use Illuminate\Database\Eloquent\Model;
class InvoiceFreight extends Model { protected $guarded=[]; protected function casts(): array{return ['rate_snapshot'=>'array'];} }
