<?php

namespace Tests\Feature\Imports;

use Tests\TestCase;

class LegacyCropSeedCompatibilityTest extends TestCase
{
    public function test_legacy_import_uses_seeded_ids_without_mapping_tables(): void
    {
        $servicePath = base_path('app/Services/Imports/LegacyCsvImportService.php');
        $source = file_get_contents($servicePath);

        $this->assertNotFalse($source);
        $this->assertStringContainsString('private function resolveSeededCrop(?string $safraId): ?int', $source);
        $this->assertStringNotContainsString("DB::table('legacy_import_maps')", $source);
        $this->assertStringContainsString("DB::table('crops')->where('id',", $source);
        $this->assertStringContainsString("'id' => $legacyId", $source);
        $this->assertStringContainsString('$cultureId = (int) $varietyCultureId;', $source);
        $this->assertStringContainsString("'name' => \$name", $source);
        $this->assertStringContainsString("'HARVESTER_ADVANCE'", $source);
        $this->assertStringContainsString("'TRANSPORTER_ADVANCE'", $source);
    }

    public function test_farm_import_also_creates_state_registration_without_culture(): void
    {
        $source = file_get_contents(base_path('app/Services/Imports/LegacyCsvImportService.php'));

        $this->assertNotFalse($source);
        $this->assertStringContainsString("\$row['inscricao_estadual']", $source);
        $this->assertStringContainsString("DB::table('farm_state_registrations')->updateOrInsert", $source);
        $this->assertStringContainsString("'culture_id' => null", $source);
    }
}
