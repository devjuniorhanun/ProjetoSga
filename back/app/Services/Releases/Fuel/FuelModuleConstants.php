<?php
namespace App\Services\Releases\Fuel;
final class FuelModuleConstants {
    public const STATION_PHYSICAL='F'; public const STATION_MOBILE='M';
    public const ACTIVE='A'; public const INACTIVE='I';
    public const METER_HOURS='H'; public const METER_KM='K';
    public const MOVEMENT_ENTRY='E'; public const MOVEMENT_EXIT='S'; public const MOVEMENT_TRANSFER='T'; public const MOVEMENT_RETURN='D'; public const MOVEMENT_ADJUSTMENT='A';
    public const INBOUND='I'; public const OUTBOUND='O';
    public const TRANSFER_DRAFT='D'; public const TRANSFER_CONFIRMED='C'; public const TRANSFER_CANCELLED='X';
}
