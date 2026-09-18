<?php

namespace App\Services\Releases\Grain;

use Illuminate\Support\Facades\DB;

class DocumentNumberService
{
    public function next(string $type, ?int $year = null, ?int $month = null): string
    {
        $year ??= (int) now()->format('Y');
        DB::table('grain_document_sequences')->insertOrIgnore([
            'document_type' => $type,
            'year' => $year,
            'last_number' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $sequence = DB::table('grain_document_sequences')
            ->where('document_type', $type)->where('year', $year)->lockForUpdate()->first();

        $number = (int) $sequence->last_number + 1;
        DB::table('grain_document_sequences')->where('id', $sequence->id)->update(['last_number' => $number, 'updated_at' => now()]);
        $period = $month ? sprintf('%d-%02d', $year, $month) : (string) $year;

        return sprintf('%s-%s-%06d', $type, $period, $number);
    }
}
