<?php

namespace App\Http\Controllers\Reports\Financial;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\Financial\PaidAccountReportRequest;
use App\Http\Requests\Reports\Financial\PaidAccountByCropReportRequest;
use App\Services\Reports\Financial\PaidAccountReportService;
use App\Services\Reports\Pdf\SimplePdfReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PaidAccountReportController extends Controller
{
    public function __construct(
        private PaidAccountReportService $service,
        private SimplePdfReport $pdf,
    ) {
    }

    public function analytical(PaidAccountReportRequest $request): JsonResponse
    {
        return response()->json($this->service->analytical($request->validated()));
    }

    public function byCostCenter(PaidAccountReportRequest $request): JsonResponse
    {
        return response()->json($this->service->byCostCenter($request->validated()));
    }

    public function cropOptions(Request $request): JsonResponse
    {
        $data = $request->validate([
            'agricultural_year_id' => ['nullable', 'integer', 'exists:agricultural_years,id'],
        ]);

        return response()->json($this->service->cropOptions($data['agricultural_year_id'] ?? null));
    }

    public function byCrop(PaidAccountByCropReportRequest $request): JsonResponse
    {
        return response()->json($this->service->byCrop($request->validated()));
    }

    public function byCropPdf(PaidAccountByCropReportRequest $request): Response
    {
        $report = $this->service->byCrop($request->validated());
        $rows = [];
        foreach ($report['sections'] as $section) {
            foreach ($section['suppliers'] as $supplier) {
                foreach ($supplier['items'] as $item) {
                    $rows[] = [
                        'supplier' => $item['supplier_name'],
                        'cost_center' => $item['cost_center_name'],
                        'document' => $item['document_number'],
                        'date' => $this->dateBr($item['document_date']),
                        'due' => $this->dateBr($item['due_date']),
                        'value' => $this->currency($item['value']),
                        'description' => $item['description'],
                    ];
                }
                $rows[] = [
                    'supplier' => '',
                    'cost_center' => '',
                    'document' => '',
                    'date' => '',
                    'due' => 'Total:',
                    'value' => $this->currency($supplier['total']),
                    'description' => '',
                    '_subtotal' => true,
                ];
            }
        }
        $columns = [
            ['key' => 'supplier', 'label' => 'Fornecedor', 'width' => 165, 'chars' => 34],
            ['key' => 'cost_center', 'label' => 'Centro de custo', 'width' => 110, 'chars' => 22],
            ['key' => 'document', 'label' => 'Documento', 'width' => 90, 'chars' => 18],
            ['key' => 'date', 'label' => 'Pagamento', 'width' => 62, 'chars' => 10],
            ['key' => 'due', 'label' => 'Vencimento', 'width' => 62, 'chars' => 10],
            ['key' => 'value', 'label' => 'Valor', 'width' => 82, 'chars' => 16],
            ['key' => 'description', 'label' => 'Descrição', 'width' => 205, 'chars' => 42],
        ];

        return $this->pdfResponse('contas-pagas-por-safra.pdf', $this->pdf->render(
            'Relatório de Contas Pagas por Safra', $this->subtitle($report), $columns, $rows,
            ['Total geral' => $this->currency($report['summary']['grand_total'])]
        ));
    }

    public function analyticalPdf(PaidAccountReportRequest $request): Response
    {
        $report = $this->service->analytical($request->validated());
        $rows = [];
        foreach ($report['sections'] as $section) {
            foreach ($section['suppliers'] as $supplier) {
                foreach ($supplier['items'] as $item) {
                    $rows[] = [
                        'supplier' => $item['supplier_name'],
                        'cost_center' => $item['cost_center_name'],
                        'document' => $item['document_number'],
                        'date' => $this->dateBr($item['document_date']),
                        'due' => $this->dateBr($item['due_date']),
                        'value' => $this->currency($item['value']),
                        'description' => $item['description'],
                    ];
                }
                $rows[] = [
                    'supplier' => '',
                    'cost_center' => '',
                    'document' => '',
                    'date' => '',
                    'due' => 'Total:',
                    'value' => $this->currency($supplier['total']),
                    'description' => '',
                    '_subtotal' => true,
                ];
            }
        }
        $columns = [
            ['key' => 'supplier', 'label' => 'Fornecedor', 'width' => 165, 'chars' => 34],
            ['key' => 'cost_center', 'label' => 'Centro de custo', 'width' => 110, 'chars' => 22],
            ['key' => 'document', 'label' => 'Documento', 'width' => 90, 'chars' => 18],
            ['key' => 'date', 'label' => 'Pagamento', 'width' => 62, 'chars' => 10],
            ['key' => 'due', 'label' => 'Vencimento', 'width' => 62, 'chars' => 10],
            ['key' => 'value', 'label' => 'Valor', 'width' => 82, 'chars' => 16],
            ['key' => 'description', 'label' => 'Descrição', 'width' => 205, 'chars' => 42],
        ];
        $summary = [];
        foreach ($report['sections'] as $section) {
            $summary[$section['name'].' ('.$section['payments_count'].' pagamento(s))'] = $this->currency($section['total']);
        }
        $summary['Total geral'] = $this->currency($report['summary']['grand_total']);

        return $this->pdfResponse('contas-pagas-analitico.pdf', $this->pdf->render(
            'Relatório Analítico de Contas Pagas', $this->subtitle($report), $columns, $rows,
            $summary
        ));
    }

    public function byCostCenterPdf(PaidAccountReportRequest $request): Response
    {
        $report = $this->service->byCostCenter($request->validated());
        $rows = array_map(fn (array $row): array => [
            'name' => $row['name'],
            'count' => (string) $row['payments_count'],
            'value' => $this->currency($row['total']),
            'percentage' => number_format($row['percentage'], 2, ',', '.').'%',
        ], $report['by_cost_center']);
        $columns = [
            ['key' => 'name', 'label' => 'Centro de custo', 'width' => 390, 'chars' => 75],
            ['key' => 'count', 'label' => 'Lançamentos', 'width' => 100, 'chars' => 12],
            ['key' => 'value', 'label' => 'Valor', 'width' => 150, 'chars' => 22],
            ['key' => 'percentage', 'label' => 'Participação', 'width' => 120, 'chars' => 15],
        ];

        return $this->pdfResponse('contas-pagas-por-centro-de-custo.pdf', $this->pdf->render(
            'Relatório de Contas Pagas por Centro de Custo', $this->subtitle($report), $columns, $rows,
            ['Contas' => $this->currency($report['summary']['accounts_total']),
             'Folha' => $this->currency($report['summary']['payroll_total']),
             'Total geral' => $this->currency($report['summary']['grand_total'])]
        ));
    }

    private function pdfResponse(string $filename, string $content): Response
    {
        return response($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
            'Cache-Control' => 'private, no-store, max-age=0',
        ]);
    }

    private function subtitle(array $report): string
    {
        $crop = isset($report['crop'])
            ? ' | Ano agrícola: '.$report['agricultural_year']['name'].' | Safra: '.$report['crop']['name']
            : '';

        return 'Período: '.$this->dateBr($report['period']['date_from']).' a '.$this->dateBr($report['period']['date_to']).$crop.
            ' | Gerado em '.now()->format('d/m/Y H:i');
    }

    private function dateBr(?string $date): string
    {
        if (! $date) {
            return '';
        }

        return implode('/', array_reverse(explode('-', $date)));
    }

    private function currency(float $value): string
    {
        return 'R$ '.number_format($value, 2, ',', '.');
    }
}
