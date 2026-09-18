<?php
namespace App\Services\Releases\Fuel;
use App\Models\Releases\Fuel\FuelEntry;
use App\Models\Releases\Fuel\FuelTransfer;
use App\Models\Releases\Fuel\FuelRefueling;
use App\Models\Releases\Fuel\FleetMeterReading;
use App\Models\Releases\Fuel\FuelTankGaugeReading;
use App\Models\Releases\Fuel\FuelTank;
use App\Models\Releases\Fuel\FuelTankGaugeTable;
use App\Models\Releases\Fuel\FuelStationProduct;
use App\Models\Releases\Fuel\FuelRegistradora;
use App\Models\Releases\Fuel\FuelRegistradoraReading;
use App\Models\Registrations\Vehicle\Fleet;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FuelManagementService {
    public function __construct(private FuelStockService $stock) {}
    public function createEntry(array $data): FuelEntry { return DB::transaction(function() use($data){ $data['responsible_id']=auth()->id(); $this->assertTankBelongsToStation($data['fuel_tank_id']??null,$data['fuel_station_id']); $this->assertStationProduct($data['fuel_station_id'],$data['product_id']); $entry=FuelEntry::create($data); if(($data['status']??'A')==='A') $this->stock->registerEntry([...$data,'entry_id'=>$entry->id]); return $entry->load(['station','product']); }); }
    public function confirmTransfer(FuelTransfer $transfer): FuelTransfer { return DB::transaction(function() use($transfer){ $transfer=FuelTransfer::lockForUpdate()->findOrFail($transfer->id); if($transfer->status==='C') return $transfer; if($transfer->status==='X') throw ValidationException::withMessages(['status'=>'Transferência cancelada não pode ser confirmada.']); $this->assertTankBelongsToStation($transfer->source_tank_id,$transfer->source_station_id); $this->assertTankBelongsToStation($transfer->destination_tank_id,$transfer->destination_station_id); $this->assertStationProduct($transfer->source_station_id,$transfer->product_id); $this->assertStationProduct($transfer->destination_station_id,$transfer->product_id); $user=auth()->id(); $this->stock->moveStock($transfer->source_station_id,$transfer->product_id,(float)$transfer->quantity,'T','O',$transfer->source_tank_id,'fuel_transfer',$transfer->id,null,$user,'Transferência de saída.'); $this->stock->moveStock($transfer->destination_station_id,$transfer->product_id,(float)$transfer->quantity,'T','I',$transfer->destination_tank_id,'fuel_transfer',$transfer->id,null,$user,'Transferência de entrada.'); $transfer->update(['status'=>'C']); return $transfer->fresh(); }); }
    public function createRefueling(array $data): FuelRefueling { return DB::transaction(function() use($data){ $fleet=Fleet::findOrFail($data['fleet_id']); if($fleet->marking_type!==$data['marking_type']) throw ValidationException::withMessages(['marking_type'=>'O tipo de marcação deve ser igual ao configurado na frota.']); if($data['meter_value']===null && isset($data['meter_value'])) throw ValidationException::withMessages(['meter_value'=>'Informe o horímetro/quilometragem do abastecimento.']); $this->assertStationProduct($data['fuel_station_id'],$data['product_id']); $data['responsible_id']=auth()->id(); $ref=FuelRefueling::create($data); $this->stock->registerRefueling([...$data,'refueling_id'=>$ref->id]); return $ref->load(['station','product','fleet']); }); }
    public function createMeterReading(array $data): FleetMeterReading { return DB::transaction(function() use($data){ $fleet=Fleet::findOrFail($data['fleet_id']); if($fleet->marking_type!==$data['marking_type']) throw ValidationException::withMessages(['marking_type'=>'O tipo informado não corresponde à frota.']); $initial=$data['initial_value']??null; $final=(float)$data['final_value']; if($initial!==null && $final<$initial) throw ValidationException::withMessages(['final_value'=>'A leitura final não pode ser menor que a inicial.']); $data['worked_value']=$initial===null?0:$final-(float)$initial; $data['responsible_id']=auth()->id(); return FleetMeterReading::create($data); }); }
    public function createGaugeReading(array $data): FuelTankGaugeReading { return DB::transaction(function() use($data){ $table=FuelTankGaugeTable::where('fuel_tank_id',$data['fuel_tank_id'])->orderBy('centimeters')->get(); if($table->isEmpty()) throw ValidationException::withMessages(['fuel_tank_id'=>'O tanque não possui tabela de régua configurada.']); $cm=(float)$data['centimeters']; $exact=$table->first(fn($r)=>(float)$r->centimeters===$cm); if($exact) $liters=(float)$exact->liters; else { $lower=$table->where('centimeters','<',$cm)->sortByDesc('centimeters')->first(); $upper=$table->where('centimeters','>',$cm)->sortBy('centimeters')->first(); if(!$lower || !$upper) throw ValidationException::withMessages(['centimeters'=>'A medida está fora da faixa configurada da régua.']); $x0=(float)$lower->centimeters;$y0=(float)$lower->liters;$x1=(float)$upper->centimeters;$y1=(float)$upper->liters;$liters=$y0+(($cm-$x0)*($y1-$y0)/($x1-$x0)); } $data['liters']=$liters; $data['responsible_id']=auth()->id(); return FuelTankGaugeReading::create($data); }); }
    public function reconciliation(int $stationId,int $productId,?string $date=null): array { $date=$date??now()->toDateString(); $sp=FuelStationProduct::where('fuel_station_id',$stationId)->where('product_id',$productId)->firstOrFail(); $registradora=FuelRegistradora::where('fuel_station_id',$stationId)->where('product_id',$productId)->first(); $reading=$registradora?FuelRegistradoraReading::where('fuel_registradora_id',$registradora->id)->whereDate('reading_date',$date)->first():null; $physical=FuelTankGaugeReading::whereHas('tank',fn($q)=>$q->where('fuel_station_id',$stationId))->whereDate('reading_at',$date)->latest('reading_at')->value('liters'); $output=$reading?(float)$reading->quantity:null; $theoretical=(float)$sp->current_stock; return ['station_id'=>$stationId,'product_id'=>$productId,'date'=>$date,'theoretical_stock'=>$theoretical,'physical_stock'=>$physical,'registradora_output'=>$output,'difference_physical'=>$physical===null?null:$physical-$theoretical,'difference_registradora'=>$output===null?null:$output]; }
    public function consumption(int $fleetId, string $start, string $end): array { $fleet=Fleet::findOrFail($fleetId); $fuel=(float)FuelRefueling::where('fleet_id',$fleetId)->whereBetween('refueled_at',[$start.' 00:00:00',$end.' 23:59:59'])->sum('quantity'); $work=(float)FleetMeterReading::where('fleet_id',$fleetId)->whereBetween('reading_date',[$start,$end])->sum('worked_value'); if($fleet->marking_type==='H') return ['fleet_id'=>$fleetId,'marking_type'=>'H','fuel_consumption'=>$fuel,'worked_hours'=>$work,'average_liters_per_hour'=>$work>0?$fuel/$work:null]; $index=$work>0?$fuel/$work:null; return ['fleet_id'=>$fleetId,'marking_type'=>'K','fuel_consumption'=>$fuel,'kilometers'=>$work,'consumption_index_liters_per_km'=>$index,'expected_consumption_liters'=>$index===null?null:$index*$work]; }

    private function assertStationProduct(int $stationId, int $productId): void
    {
        if (!FuelStationProduct::where('fuel_station_id',$stationId)->where('product_id',$productId)->exists()) {
            throw ValidationException::withMessages(['product_id'=>'O produto não está habilitado no posto informado.']);
        }
    }

    private function assertTankBelongsToStation(?int $tankId, int $stationId): void
    {
        if ($tankId !== null && !FuelTank::where('id',$tankId)->where('fuel_station_id',$stationId)->exists()) {
            throw ValidationException::withMessages(['fuel_tank_id'=>'O tanque informado não pertence ao posto.']);
        }
    }

}
