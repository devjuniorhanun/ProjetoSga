/** Transferências de grãos da colheita (backend Laravel é a fonte oficial). */

export interface HarvestGrainTransfer {
  id: string;
  crop_id: string;
  crop_name?: string;
  producer_id: string;
  producer_name?: string;
  owner_id: string;
  owner_name?: string;
  owner_payment_type?: string;
  warehouse_id: string;
  warehouse_name?: string;
  culture_id: string;
  culture_name?: string;
  transfer_date: string;
  quantity_kg: number;
  quantity_bags: number;
  observation?: string | null;
  status: 'A' | 'I';
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

/** quantity_bags é calculado e gravado pelo backend — nunca enviar. */
export interface HarvestGrainTransferPayload {
  crop_id: string;
  producer_id: string;
  owner_id: string;
  warehouse_id: string;
  culture_id: string;
  transfer_date: string;
  quantity_kg: number;
  observation?: string | null;
  status: 'A' | 'I';
}

export interface HarvestGrainTransferFilters {
  crop_id?: string;
  producer_id?: string;
  owner_id?: string;
  warehouse_id?: string;
  culture_id?: string;
  status?: 'A' | 'I';
  per_page?: number;
}

export interface EligibleTransferOwner {
  id: string;
  name?: string;
  owner_name?: string;
  corporate_name?: string;
  fantasy_name?: string;
  payment_type?: string;
  status?: 'A' | 'I';
}

export interface HarvestTransferAvailableBalance {
  available_kg: number;
  available_bags: number;
}
