<?php

namespace App\Services\Shared;

use Illuminate\Support\Facades\DB;

class DocumentSequenceService
{
    public function next(string $type, ?int $year = null): string
    {
        $year ??= (int) now()->format('Y');
        $row = DB::table('document_sequences')->where('document_type', $type)->where('year', $year)->lockForUpdate()->first();
        if (!$row) {
            DB::table('document_sequences')->insert(['document_type' => $type, 'year' => $year, 'last_number' => 0, 'created_at' => now(), 'updated_at' => now()]);
            $row = DB::table('document_sequences')->where('document_type', $type)->where('year', $year)->lockForUpdate()->first();
        }
        $number = (int) $row->last_number + 1;
        DB::table('document_sequences')->where('id', $row->id)->update(['last_number' => $number, 'updated_at' => now()]);
        return sprintf('%s-%d-%06d', $type, $year, $number);
    }
}
