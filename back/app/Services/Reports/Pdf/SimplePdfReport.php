<?php

namespace App\Services\Reports\Pdf;

/** Gerador PDF interno para relatórios tabulares, sem dependência externa. */
class SimplePdfReport
{
    private array $pages = [];

    public function render(string $title, string $subtitle, array $columns, array $rows, array $summary): string
    {
        // Reserva espaço no rodapé da última página para todos os totalizadores.
        $pageRows = max(10, 27 - count($summary));
        $chunks = array_chunk($rows, $pageRows);
        if ($chunks === []) {
            $chunks = [[]];
        }

        foreach ($chunks as $index => $chunk) {
            $this->pages[] = $this->page($title, $subtitle, $columns, $chunk, $summary,
                $index + 1, count($chunks), $index === count($chunks) - 1);
        }

        return $this->build();
    }

    private function page(string $title, string $subtitle, array $columns, array $rows, array $summary,
        int $page, int $pages, bool $last): string
    {
        $commands = ['0.08 0.20 0.15 rg', 'BT', '/F2 17 Tf', '36 555 Td', $this->text($title),
            '0 -20 Td', '/F1 9 Tf', $this->text($subtitle), 'ET'];
        $y = 510;
        $commands[] = '0.90 0.95 0.92 rg 32 '.($y - 5).' 778 22 re f';
        $x = 38;
        foreach ($columns as $column) {
            $commands[] = '0.08 0.20 0.15 rg BT /F2 7 Tf '.$x.' '.$y.' Td '.$this->text($column['label']).' ET';
            $x += $column['width'];
        }
        $y -= 22;

        foreach ($rows as $row) {
            $subtotal = (bool) ($row['_subtotal'] ?? false);
            if ($subtotal) {
                $commands[] = '0.94 0.96 0.95 rg 32 '.($y - 5).' 778 16 re f';
            }
            $x = 38;
            foreach ($columns as $column) {
                $value = (string) ($row[$column['key']] ?? '');
                $value = mb_strimwidth($value, 0, $column['chars'], '...');
                $font = $subtotal ? '/F2' : '/F1';
                $commands[] = '0.12 0.16 0.14 rg BT '.$font.' 6.6 Tf '.$x.' '.$y.' Td '.$this->text($value).' ET';
                $x += $column['width'];
            }
            $commands[] = '0.85 0.88 0.86 RG 32 '.($y - 5).' m 810 '.($y - 5).' l S';
            $y -= 16;
        }

        if ($last) {
            $y -= 8;
            foreach ($summary as $label => $value) {
                $commands[] = '0.08 0.20 0.15 rg BT /F2 8 Tf 560 '.$y.' Td '.$this->text($label.':').' ET';
                $commands[] = '0.08 0.20 0.15 rg BT /F2 8 Tf 700 '.$y.' Td '.$this->text($value).' ET';
                $y -= 15;
            }
        }

        $commands[] = '0.38 0.45 0.41 rg BT /F1 7 Tf 36 20 Td '.$this->text('SISDEVE Agro - Página '.$page.' de '.$pages).' ET';

        return implode("\n", $commands);
    }

    private function text(string $value): string
    {
        $encoded = iconv('UTF-8', 'Windows-1252//TRANSLIT', $value) ?: $value;
        $encoded = str_replace(['\\', '(', ')', "\r", "\n"], ['\\\\', '\\(', '\\)', ' ', ' '], $encoded);

        return '('.$encoded.') Tj';
    }

    private function build(): string
    {
        $objects = [];
        $catalog = 1;
        $pagesObject = 2;
        $fontRegular = 3;
        $fontBold = 4;
        $objects[$fontRegular] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[$fontBold] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
        $kids = [];
        $next = 5;
        foreach ($this->pages as $content) {
            $pageObject = $next++;
            $contentObject = $next++;
            $kids[] = $pageObject.' 0 R';
            $objects[$pageObject] = '<< /Type /Page /Parent '.$pagesObject.' 0 R /MediaBox [0 0 842 595] '.
                '/Resources << /Font << /F1 '.$fontRegular.' 0 R /F2 '.$fontBold.' 0 R >> >> /Contents '.$contentObject.' 0 R >>';
            $objects[$contentObject] = '<< /Length '.strlen($content).' >>' . "\nstream\n" . $content . "\nendstream";
        }
        $objects[$pagesObject] = '<< /Type /Pages /Kids ['.implode(' ', $kids).'] /Count '.count($kids).' >>';
        $objects[$catalog] = '<< /Type /Catalog /Pages '.$pagesObject.' 0 R >>';
        ksort($objects);

        $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $offsets = [0];
        foreach ($objects as $number => $object) {
            $offsets[$number] = strlen($pdf);
            $pdf .= $number." 0 obj\n".$object."\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= 'xref'."\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf('%010d 00000 n ', $offsets[$i])."\n";
        }
        $pdf .= 'trailer << /Size '.(count($objects) + 1).' /Root '.$catalog." 0 R >>\nstartxref\n".$xref."\n%%EOF";

        return $pdf;
    }
}
