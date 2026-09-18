import { useQuery } from '@tanstack/react-query';
import { agriculturalServicesDefensiveService } from '@/lib/api-services/agricultural-services-defensive';
import type { Fleet } from '@/lib/api-services-vehicles';
import type { ComboboxOption } from '@/components/ui/combobox';

/** Rótulo da frota: código — nome — marca/modelo — placa. */
export function fleetOptionLabel(fleet: Fleet): string {
  const brandModel = [fleet.fleet_brand_name, fleet.fleet_model_name].filter(Boolean).join(' ');
  return [fleet.code, fleet.name, brandModel, fleet.plate]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' — ') || String(fleet.id);
}

/**
 * Frotas permitidas para a função do operador (O = PULVERIZADO, T = TRATOR).
 * A lista vem sempre do backend; o React Query isola o cache por função,
 * então respostas atrasadas de uma função anterior nunca sobrescrevem a atual.
 */
export function useFleetsByFunction(fn: 'O' | 'T' | '' | undefined) {
  const query = useQuery({
    queryKey: ['defensive-fleets-by-function', fn],
    queryFn: ({ signal }) => agriculturalServicesDefensiveService.getFleetsByFunction(fn as 'O' | 'T', signal),
    enabled: fn === 'O' || fn === 'T',
    staleTime: 5 * 60 * 1000,
  });

  const fleets: Fleet[] = query.data ?? [];
  const options: ComboboxOption[] = fleets.map((f) => ({ value: String(f.id), label: fleetOptionLabel(f) }));

  return {
    fleets,
    options,
    isLoading: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
