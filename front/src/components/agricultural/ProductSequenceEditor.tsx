import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GripVertical, Save } from 'lucide-react';
import { defensiveOrdersService } from '@/lib/api-services-entries';
import { agriculturalProductsService, typeFormulationsService } from '@/lib/api-services-agricultural';
import {
  buildSequencePayload,
  canReorderOrderProducts,
  moveWithinOrderGroup,
  sortProductsByFormulationOrder,
} from '@/lib/agricultural-rules';

interface OrderProduct {
  product_id: string | number;
  product_name?: string | null;
  pump?: number | string;
}

interface Props {
  orderId: string;
  orderStatus?: string | null;
  products: OrderProduct[];
}

/**
 * Sequência de aplicação dos produtos da O.S.: ordem inicial por TypeFormulation.order
 * (menor para maior). Arrastar só é permitido dentro do mesmo grupo de order.
 */
export function ProductSequenceEditor({ orderId, orderStatus, products }: Props) {
  const queryClient = useQueryClient();
  const editable = canReorderOrderProducts(orderStatus);

  const { data: agriculturalProducts } = useQuery({
    queryKey: ['agricultural-products'],
    queryFn: () => agriculturalProductsService.getAll({ status: 'A' }),
  });
  const { data: formulations } = useQuery({
    queryKey: ['type-formulations'],
    queryFn: () => typeFormulationsService.getAll({ status: 'A' }),
  });

  const orderOf = useMemo(() => {
    const formulationOrder = new Map<string, number>();
    (formulations ?? []).forEach((f) => formulationOrder.set(String(f.id), Number(f.order)));
    const productFormulation = new Map<string, string>();
    (agriculturalProducts ?? []).forEach((p) =>
      productFormulation.set(String(p.product_id), String(p.type_formulation_id)),
    );
    return (productId: string) => {
      const formulationId = productFormulation.get(String(productId));
      if (!formulationId) return null;
      return formulationOrder.get(formulationId) ?? null;
    };
  }, [agriculturalProducts, formulations]);

  const [list, setList] = useState<OrderProduct[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    setList(sortProductsByFormulationOrder(products ?? [], orderOf));
  }, [products, orderOf]);

  const save = useMutation({
    mutationFn: () => {
      const payload = buildSequencePayload(list.map((p) => p.product_id));
      return defensiveOrdersService.updateProductsSequence(orderId, payload.product_ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defensive-orders'] });
      toast.success('Sequência de produtos atualizada.');
    },
    onError: (error: unknown) => {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      toast.error(response?.data?.message ?? 'Não foi possível salvar a sequência.');
    },
  });

  const handleDrop = (index: number) => {
    if (dragIndex === null) return;
    const next = moveWithinOrderGroup(list, dragIndex, index, (item) => orderOf(String(item.product_id)));
    if (next === list) {
      toast.error('A ordem só pode ser alterada entre produtos da mesma formulação.');
    }
    setList(next);
    setDragIndex(null);
  };

  if (!list.length) return null;

  return (
    <div className="space-y-2 print:hidden">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Sequência de aplicação</h3>
        {editable && (
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="mr-2 h-4 w-4" /> Salvar sequência
          </Button>
        )}
      </div>
      <ul className="divide-y rounded-md border">
        {list.map((product, index) => (
          <li
            key={String(product.product_id)}
            draggable={editable}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(index)}
            className="flex items-center gap-2 p-2 text-sm"
          >
            {editable && <GripVertical className="h-4 w-4 text-muted-foreground" />}
            <span className="w-6 text-muted-foreground">{index + 1}</span>
            <span className="flex-1">{product.product_name ?? product.product_id}</span>
            <span className="text-muted-foreground">
              Formulação: {orderOf(String(product.product_id)) ?? '-'}
            </span>
          </li>
        ))}
      </ul>
      {!editable && (
        <p className="text-xs text-muted-foreground">
          A O.S. está fechada: a sequência preserva o histórico e não pode ser alterada.
        </p>
      )}
    </div>
  );
}

export default ProductSequenceEditor;
