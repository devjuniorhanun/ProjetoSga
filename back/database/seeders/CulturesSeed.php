<?php

namespace Database\Seeders;

use App\Models\Registrations\Harvest\AgriculturalYear;
use App\Models\Registrations\Harvest\Crop;
use App\Models\Registrations\Harvest\Culture;
use Illuminate\Database\Seeder;

class CulturesSeed extends Seeder
{
    public function run(): void
    {
        foreach ([1 => 'SOJA', 2 => 'MILHO', 3 => 'MILHETO', 4 => 'SORGO'] as $id => $name) {
            Culture::updateOrCreate(['id' => $id], ['name' => $name, 'status' => 'A']);
        }

        $catalog = [
            ['year'=>'ANO AGRÍCOLA 2020/2021','year_status'=>'I','id'=>2,'crop'=>'SAFRA SOJA 20/21','cultures'=>[1],'status'=>'I'],
            ['year'=>'ANO AGRÍCOLA 2021/2022','year_status'=>'I','id'=>4,'crop'=>'SAFRINHA MILHO 21','cultures'=>[2,3],'status'=>'I'],
            ['year'=>'ANO AGRÍCOLA 2021/2022','year_status'=>'I','id'=>5,'crop'=>'SAFRA SOJA 21/22','cultures'=>[1],'status'=>'I'],
            ['year'=>'ANO AGRÍCOLA 2022/2023','year_status'=>'I','id'=>6,'crop'=>'SAFRINHA MILHO 22','cultures'=>[2,3],'status'=>'I'],
            ['year'=>'ANO AGRÍCOLA 2022/2023','year_status'=>'I','id'=>7,'crop'=>'SAFRA SOJA 22/23','cultures'=>[1],'status'=>'I'],
            ['year'=>'ANO AGRÍCOLA 2023/2024','year_status'=>'I','id'=>8,'crop'=>'SAFRINHA MILHO 23','cultures'=>[2,3],'status'=>'I'],
            ['year'=>'ANO AGRÍCOLA 2023/2024','year_status'=>'I','id'=>9,'crop'=>'SAFRA SOJA 23/24','cultures'=>[1],'status'=>'I'],
            ['year'=>'ANO AGRÍCOLA 2024/2025','year_status'=>'I','id'=>10,'crop'=>'SAFRINHA 24','cultures'=>[2,3],'status'=>'I'],
            ['year'=>'ANO AGRÍCOLA 2024/2025','year_status'=>'I','id'=>11,'crop'=>'SAFRA SOJA 24/25','cultures'=>[1],'status'=>'I'],
            ['year'=>'ANO AGRÍCOLA 2025/2026','year_status'=>'I','id'=>13,'crop'=>'SAFRINHA 25','cultures'=>[2,3],'status'=>'I'],
            ['year'=>'ANO AGRÍCOLA 2025/2026','year_status'=>'I','id'=>14,'crop'=>'SAFRA SOJA 25/26','cultures'=>[1],'status'=>'I'],
            ['year'=>'ANO AGRÍCOLA 2026/2027','year_status'=>'A','id'=>15,'crop'=>'SAFRINHA 26','cultures'=>[2,3,4],'status'=>'I'],
            ['year'=>'ANO AGRÍCOLA 2026/2027','year_status'=>'A','id'=>16,'crop'=>'SAFRA SOJA 26/27','cultures'=>[1],'status'=>'A'],
        ];

        foreach ($catalog as $item) {
            $year = AgriculturalYear::updateOrCreate(['name'=>$item['year']], ['status'=>$item['year_status']]);
            $crop = Crop::updateOrCreate(['id'=>$item['id']], [
                'agricultural_year_id'=>$year->id, 'name'=>$item['crop'], 'status'=>$item['status'],
            ]);
            $crop->cultures()->syncWithoutDetaching($item['cultures']);
        }
    }
}
