<?php

namespace App\Http\Controllers\Releases\Harvest;

use App\Http\Controllers\Controller;
use App\Models\Releases\Harvest\HarvestRelease;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class HarvestReleaseController extends Controller
{
    public function plotFields(Request $request)
    {
        $data=$request->validate(['crop_id'=>'required|integer|exists:crops,id']);
        return DB::table('plot_fields as pf')->join('fields as f','f.id','=','pf.field_id')->leftJoin('cultures as c','c.id','=','pf.culture_id')->leftJoin('variety_cultures as v','v.id','=','pf.variety_culture_id')->where('pf.crop_id',$data['crop_id'])->where('pf.status','A')->where('f.status','A')->whereNull('pf.deleted_at')->whereNull('f.deleted_at')->select('pf.id','pf.name as plot_name','pf.crop_id','pf.culture_id','pf.variety_culture_id','pf.area','f.id as field_id','f.name as field_name','f.block','c.name as culture_name','v.name as variety_name')->orderBy('pf.name')->get();
    }

    public function stateRegistrations(Request $request)
    {
        $data = $request->validate([
            'owner_id' => ['required', 'integer', 'exists:owners,id'],
        ]);

        return DB::table('farm_state_registrations as fsr')
            ->join('producers as p', 'p.id', '=', 'fsr.producer_id')
            ->join('farms as f', 'f.id', '=', 'fsr.farm_id')
            ->where('p.owner_id', $data['owner_id'])
            ->where('p.status', 'A')
            ->where('f.status', 'A')
            ->where('fsr.status', 'A')
            ->whereNull('p.deleted_at')
            ->whereNull('f.deleted_at')
            ->whereNull('fsr.deleted_at')
            ->select('fsr.id', 'fsr.producer_id', 'fsr.farm_id', 'fsr.state_registration', 'fsr.description', 'f.name as farm_name')
            ->orderBy('f.name')
            ->orderBy('fsr.state_registration')
            ->get();
    }

    public function matrixFreight(Request $request)
    {
        $data=$request->validate(['crop_id'=>'required|integer|exists:crops,id','plot_field_id'=>'required|integer|exists:plot_fields,id','warehouse_id'=>'required|integer|exists:warehouses,id','release_date'=>'nullable|date_format:Y-m-d']);
        $routes=$this->matrixQuery($data, $data['release_date'] ?? now()->toDateString())->get();
        if($routes->isEmpty())throw ValidationException::withMessages(['matrix_freight_id'=>['Não existe matriz de frete vigente para a safra, bloco do talhão e rota do armazém.']]);
        if($routes->count()>1)throw ValidationException::withMessages(['matrix_freight_id'=>['Existem matrizes de frete com vigências sobrepostas para este percurso.']]);
        return $routes->first();
    }

    public function index(Request $request)
    {
        return DB::table('harvest_releases as hr')->join('crops as c','c.id','=','hr.crop_id')->join('drivers as d','d.id','=','hr.driver_id')->join('suppliers as ds','ds.id','=','d.supplier_id')->join('owners as o','o.id','=','hr.owner_id')->join('warehouses as w','w.id','=','hr.warehouse_id')->join('lanyards as l','l.id','=','hr.lanyard_id')->join('suppliers as ls','ls.id','=','l.supplier_id')->join('plot_fields as pf','pf.id','=','hr.plot_field_id')->join('fields as f','f.id','=','pf.field_id')->leftJoin('variety_cultures as v','v.id','=','pf.variety_culture_id')->leftJoin('farm_state_registrations as fsr','fsr.id','=','hr.farm_state_registration_id')->leftJoin('matrix_freights as mf','mf.id','=','hr.matrix_freight_id')->whereNull('hr.deleted_at')->when($request->crop_id,fn($q,$v)=>$q->where('hr.crop_id',$v))->when($request->driver_id,fn($q,$v)=>$q->where('hr.driver_id',$v))->when($request->supplier_id,fn($q,$v)=>$q->where('d.supplier_id',$v))->select('hr.*','c.name as crop_name','o.corporate_name as owner_name','pf.name as plot_name','f.name as field_name','v.name as variety_name','w.name as warehouse_name','fsr.state_registration','ds.corporate_reason as driver_supplier_name','ls.corporate_reason as lanyard_supplier_name','mf.price as matrix_freight_price')->orderByDesc('hr.release_date')->paginate(min($request->integer('per_page',25),100));
    }

    public function store(Request $request) { return $this->save($request, new HarvestRelease(), 201); }
    public function show(HarvestRelease $harvestRelease) { return $harvestRelease; }
    public function update(Request $request, HarvestRelease $harvestRelease) { return $this->save($request,$harvestRelease,200); }
    public function destroy(HarvestRelease $harvestRelease) { $harvestRelease->delete(); return response()->noContent(); }

    private function save(Request $request, HarvestRelease $release, int $status)
    {
        $required=$release->exists?'sometimes':'required';
        $data=$request->validate([
            'crop_id'=>[$required,'integer','exists:crops,id'], 'driver_id'=>[$required,'integer','exists:drivers,id'],
            'owner_id'=>[$required,'integer','exists:owners,id'], 'farm_state_registration_id'=>[$required,'integer','exists:farm_state_registrations,id'], 'plot_field_id'=>[$required,'integer','exists:plot_fields,id'],
            'warehouse_id'=>[$required,'integer','exists:warehouses,id'], 'lanyard_id'=>[$required,'integer','exists:lanyards,id'], 'release_date'=>[$required,'date'],
            'shipping_number'=>[$required,'string','max:100'], 'control_number'=>[$required,'string','max:100'],
            'gross_weight'=>[$required,'numeric','gt:0'], 'discount'=>[$required,'numeric','min:0','max:100'],
            'status'=>['sometimes',Rule::in(['A','I'])],
        ]);
        $data=array_merge($release->only($release->getFillable()),$data);
        if(!DB::table('crops')->where('id',$data['crop_id'])->where('status','A')->whereNull('deleted_at')->exists())throw ValidationException::withMessages(['crop_id'=>['A safra deve estar ativa.']]);
        $registrationIsValid = DB::table('farm_state_registrations as fsr')
            ->join('producers as p', 'p.id', '=', 'fsr.producer_id')
            ->join('plot_fields as pf', function ($join) use ($data): void { $join->where('pf.id', $data['plot_field_id']); })
            ->join('fields as f', 'f.id', '=', 'pf.field_id')
            ->where('fsr.id', $data['farm_state_registration_id'])
            ->where('p.owner_id', $data['owner_id'])
            ->whereColumn('fsr.farm_id', 'f.farm_id')
            ->where('fsr.status', 'A')
            ->where('p.status', 'A')
            ->whereNull('fsr.deleted_at')
            ->whereNull('p.deleted_at')
            ->exists();
        if (!$registrationIsValid) throw ValidationException::withMessages(['farm_state_registration_id'=>['A inscrição estadual deve estar ativa e pertencer ao produtor e à fazenda do talhão selecionado.']]);
        $routes=$this->matrixQuery($data,$data['release_date'])->get();
        if($routes->isEmpty())throw ValidationException::withMessages(['matrix_freight_id'=>['Não existe matriz de frete vigente para este percurso.']]);
        if($routes->count()>1)throw ValidationException::withMessages(['matrix_freight_id'=>['Existem matrizes de frete com vigências sobrepostas para este percurso.']]);
        $route=$routes->first();$data['matrix_freight_id']=$route->id;
        $driverContract=DB::table('driver_contracts as dc')->join('drivers_contracts as c','c.id','=','dc.drivers_contract_id')->where('dc.driver_id',$data['driver_id'])->where('dc.status','A')->whereNull('dc.deleted_at')->where('c.crop_id',$data['crop_id'])->where('c.status','A')->whereNull('c.deleted_at')->exists();
        $lanyardContract=DB::table('lanyard_contracts_links as lc')->join('lanyards_contracts as c','c.id','=','lc.lanyard_contract_id')->where('lc.lanyard_id',$data['lanyard_id'])->where('lc.status','A')->whereNull('lc.deleted_at')->where('c.crop_id',$data['crop_id'])->where('c.status','A')->whereNull('c.deleted_at')->exists();
        if(!$driverContract)throw ValidationException::withMessages(['driver_id'=>['O motorista não possui contrato ativo nesta safra.']]);
        if(!$lanyardContract)throw ValidationException::withMessages(['lanyard_id'=>['O colhedor não possui contrato ativo nesta safra.']]);
        foreach(['shipping_number','control_number'] as $field)if(DB::table('harvest_releases')->where('crop_id',$data['crop_id'])->where($field,$data[$field])->when($release->exists,fn($q)=>$q->where('id','<>',$release->id))->whereNull('deleted_at')->exists())throw ValidationException::withMessages([$field=>['Este número já foi utilizado na safra.']]);
        $gross=round((float)$data['gross_weight'],3);$discount=round((float)$data['discount'],4);$discountWeight=round($gross*$discount/100,3);$net=round($gross-$discountWeight,3);$grossBags=round($gross/60,2);
        $data=array_merge($data,['discount_weight'=>$discountWeight,'net_weight'=>$net,'gross_bags'=>$grossBags,'liquid_bags'=>round($net/60,3),'shipping_value'=>round($grossBags*(float)$route->price,2),'created_by'=>$release->created_by?:$request->user()->id]);
        $release->fill($data)->save();return response()->json($release->refresh(),$status);
    }

    private function matrixQuery(array $data,string $date)
    {
        $start=$date.' 00:00:00';$end=$date.' 23:59:59';
        return DB::table('plot_fields as pf')->join('fields as f','f.id','=','pf.field_id')
            ->join('warehouses as w',function($j)use($data){$j->where('w.id',$data['warehouse_id']);})
            ->join('matrix_freights as mf',function($j)use($data){$j->on('mf.block','=','f.block')->on('mf.route','=','w.route')->where('mf.crop_id',$data['crop_id']);})
            ->where('pf.id',$data['plot_field_id'])->where('pf.crop_id',$data['crop_id'])
            ->where('pf.status','A')->where('w.status','A')->whereNull('pf.deleted_at')
            ->whereNull('w.deleted_at')->whereNull('mf.deleted_at')
            ->where(function($q){$q->where('mf.status','A')->orWhereNotNull('mf.effective_to');})
            ->where('mf.effective_from','<=',$end)
            ->where(function($q)use($start){$q->whereNull('mf.effective_to')->orWhere('mf.effective_to','>=',$start);})
            ->select('mf.id as matrix_freight_id','mf.id','mf.price','pf.name as plot_name','f.name as field_name','f.block','w.name as warehouse_name','w.route')
            ->orderByDesc('mf.effective_from');
    }
}
