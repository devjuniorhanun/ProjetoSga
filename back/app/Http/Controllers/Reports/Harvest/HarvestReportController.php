<?php

namespace App\Http\Controllers\Reports\Harvest;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\Harvest\HarvestReportRequest;
use App\Models\Registrations\Harvest\Crop;
use App\Services\Reports\Harvest\HarvestReportService;
use App\Services\Reports\Pdf\SimplePdfReport;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Http\Request;

class HarvestReportController extends Controller
{
    public function __construct(private HarvestReportService $service, private SimplePdfReport $pdf) {}

    public function consolidated(HarvestReportRequest $request, Crop $crop): JsonResponse
    {
        return response()->json($this->service->consolidated($crop, $request->validated()));
    }

    public function productivityOptions(Request $request): JsonResponse
    {
        $data = $request->validate(['crop_id' => ['nullable', 'integer', 'exists:crops,id']]);
        return response()->json($this->service->productivityOptions($data['crop_id'] ?? null));
    }

    public function consolidatedPdf(HarvestReportRequest $request, Crop $crop): Response
    {
        $report = $this->service->consolidated($crop, $request->validated());
        $rows = collect($report['entries'])->map(fn ($item): array => [
            'id' => (string) $item->id,
            'date' => $item->release_date ? date('d/m/Y', strtotime($item->release_date)) : '',
            'driver' => $item->driver_name,
            'plot' => $item->plot_name,
            'document' => $item->shipping_number,
            'gross' => $this->number((float) $item->gross_weight, 3),
            'discount' => $this->number((float) $item->discount_weight, 3),
            'net' => $this->number((float) $item->net_weight, 3),
            'bags' => $this->number((float) $item->liquid_bags, 3),
            'warehouse' => $item->warehouse_name,
            'culture' => $item->culture_name,
        ])->all();
        $columns = [
            ['key'=>'id','label'=>'#','width'=>35,'chars'=>8], ['key'=>'date','label'=>'Data','width'=>55,'chars'=>10],
            ['key'=>'driver','label'=>'Motorista','width'=>105,'chars'=>21], ['key'=>'plot','label'=>'Talhão','width'=>50,'chars'=>10],
            ['key'=>'document','label'=>'Romaneio','width'=>70,'chars'=>14], ['key'=>'gross','label'=>'Peso bruto','width'=>70,'chars'=>14],
            ['key'=>'discount','label'=>'Desconto','width'=>65,'chars'=>13], ['key'=>'net','label'=>'Peso líquido','width'=>75,'chars'=>15],
            ['key'=>'bags','label'=>'Sacas líquidas','width'=>70,'chars'=>14], ['key'=>'warehouse','label'=>'Armazém','width'=>105,'chars'=>21],
            ['key'=>'culture','label'=>'Cultura','width'=>70,'chars'=>14],
        ];
        $s = $report['summary'];
        $summary = [
            'Entrada líquida' => $this->number($s['input_net_weight_kg'], 3).' kg',
            'Transferências' => $this->number($s['transferred_weight_kg'], 3).' kg',
            'Saldo consolidado' => $this->number($s['balance_weight_kg'], 3).' kg',
            'Saldo em sacas' => $this->number($s['balance_bags'], 3).' sc',
            'Frete' => 'R$ '.$this->number($s['shipping_value'], 2),
        ];
        $subtitle = 'Safra: '.$report['crop']['name'].' | Entradas - transferências | Gerado em '.now()->format('d/m/Y H:i');
        $content = $this->pdf->render('Relatório Consolidado de Colheita', $subtitle, $columns, $rows, $summary);

        return response($content, 200, ['Content-Type'=>'application/pdf',
            'Content-Disposition'=>'inline; filename="relatorio-consolidado-colheita.pdf"',
            'Cache-Control'=>'private, no-store, max-age=0']);
    }

    public function productivityByPlot(HarvestReportRequest $request, Crop $crop): JsonResponse
    {
        return $this->productivityJson($request, $crop, 'PLOT');
    }

    public function productivityByFarm(HarvestReportRequest $request, Crop $crop): JsonResponse
    {
        return $this->productivityJson($request, $crop, 'FARM');
    }

    public function productivityByVariety(HarvestReportRequest $request, Crop $crop): JsonResponse
    {
        return $this->productivityJson($request, $crop, 'VARIETY');
    }

    public function productivityByHarvester(HarvestReportRequest $request, Crop $crop): JsonResponse
    {
        return $this->productivityJson($request, $crop, 'HARVESTER');
    }

    public function productivityByPlotPdf(HarvestReportRequest $request, Crop $crop): Response
    {
        return $this->productivityPdf($request, $crop, 'PLOT');
    }

    public function productivityByFarmPdf(HarvestReportRequest $request, Crop $crop): Response
    {
        return $this->productivityPdf($request, $crop, 'FARM');
    }

    public function productivityByVarietyPdf(HarvestReportRequest $request, Crop $crop): Response
    {
        return $this->productivityPdf($request, $crop, 'VARIETY');
    }

    public function productivityByHarvesterPdf(HarvestReportRequest $request, Crop $crop): Response
    {
        return $this->productivityPdf($request, $crop, 'HARVESTER');
    }

    private function productivityJson(HarvestReportRequest $request, Crop $crop, string $dimension): JsonResponse
    {
        return response()->json($this->service->productivity($crop, $request->validated(), $dimension));
    }

    private function productivityPdf(HarvestReportRequest $request, Crop $crop, string $dimension): Response
    {
        $report = $this->service->productivity($crop, $request->validated(), $dimension);
        $rows = collect($report['rows'])->map(fn (array $row): array => [
            'name' => $row['name'], 'trips' => (string) $row['trips_count'],
            'production' => $this->number($row['net_bags'], 3),
            'gross' => $this->number($row['gross_weight_kg'], 3),
            'net' => $this->number($row['net_weight_kg'], 3),
            'area' => $this->number($row['harvested_area_ha'], 3),
            'productivity' => $row['productivity_bags_ha'] === null ? '-' : $this->number($row['productivity_bags_ha'], 3),
            'culture' => $row['culture_name'],
        ])->all();
        $label = ['PLOT'=>'Talhão', 'FARM'=>'Fazenda', 'VARIETY'=>'Variedade', 'HARVESTER'=>'Colhedor'][$dimension];
        $columns = [
            ['key'=>'name','label'=>$label,'width'=>135,'chars'=>27], ['key'=>'trips','label'=>'Viagens','width'=>55,'chars'=>9],
            ['key'=>'production','label'=>'Produção (sc)','width'=>100,'chars'=>18], ['key'=>'gross','label'=>'Peso bruto (kg)','width'=>110,'chars'=>20],
            ['key'=>'net','label'=>'Peso líquido (kg)','width'=>110,'chars'=>20], ['key'=>'area','label'=>'Área (ha)','width'=>85,'chars'=>15],
            ['key'=>'productivity','label'=>'Produtividade','width'=>95,'chars'=>17], ['key'=>'culture','label'=>'Cultura','width'=>80,'chars'=>14],
        ];
        $s = $report['summary'];
        $summary = [
            'Produção líquida' => $this->number($s['net_bags'], 3).' sc',
            'Área colhida' => $this->number($s['harvested_area_ha'], 3).' ha',
            'Produtividade média' => $s['average_productivity_bags_ha'] === null ? '-' : $this->number($s['average_productivity_bags_ha'], 3).' sc/ha',
            'Frete pago' => 'R$ '.$this->number($s['shipping_value'], 2),
            'Frete médio' => $s['average_shipping_per_gross_bag'] === null ? '-' : 'R$ '.$this->number($s['average_shipping_per_gross_bag'], 2).'/sc',
        ];
        $content = $this->pdf->render('Produtividade por '.$label,
            'Safra: '.$crop->name.' | Gerado em '.now()->format('d/m/Y H:i'), $columns, $rows, $summary);

        return response($content, 200, ['Content-Type'=>'application/pdf',
            'Content-Disposition'=>'inline; filename="produtividade-'.strtolower($dimension).'.pdf"',
            'Cache-Control'=>'private, no-store, max-age=0']);
    }

    private function number(float $value, int $decimals): string
    {
        return number_format($value, $decimals, ',', '.');
    }
}
