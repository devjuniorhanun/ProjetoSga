import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { defensiveOrdersService, AgriculturalDefensiveOrder } from '@/lib/api-services-entries';
import { formatDate } from '@/lib/utils';
import { useCrud } from '@/hooks/use-crud';
import { Plus, Pencil, Trash2, Loader2, FileText, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DefensiveServiceForm } from './DefensiveServiceForm';
import { DefensiveServiceEditForm } from './DefensiveServiceEditForm';
import { DefensiveOrderClosingDialog } from './DefensiveOrderClosingDialog';

const STATUS_LABELS: Record<string, string> = { A: 'Aberta', I: 'Inativa', F: 'Finalizada' };

export default function DefensiveServicesList() {
  const navigate = useNavigate();
  const { data, isLoading, remove } = useCrud<AgriculturalDefensiveOrder>('defensive-orders', defensiveOrdersService);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<AgriculturalDefensiveOrder | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      try { await remove.mutateAsync(deleteId); toast.success('Registro excluído!'); } catch { toast.error('Erro ao excluir registro.'); }
      setDeleteId(null);
    }
  };

  const columns = [
    { key: 'id', label: 'O.S.' },
    { key: 'crop_name', label: 'Safra' },
    { key: 'culture_name', label: 'Cultura' },
    { key: 'field_name', label: 'Talhão' },
    { key: 'type_operation_name', label: 'Tipo de Operação' },
    { key: 'application_date', label: 'Data', render: (item: AgriculturalDefensiveOrder) => formatDate(item.application_date) },
    { key: 'area', label: 'Área' },
    { key: 'recommended_pump', label: 'Bombas Recomendadas' },
    { key: 'used_bomb', label: 'Bombas Utilizadas', render: (item: AgriculturalDefensiveOrder) => item.used_bomb ?? 0 },
    { key: 'status', label: 'Status', render: (item: AgriculturalDefensiveOrder) => (
      <Badge
        variant={item.status === 'A' ? 'default' : 'secondary'}
        className={item.status === 'A' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15' : ''}
      >
        {STATUS_LABELS[item.status] ?? item.status}
      </Badge>
    ) },
  ];

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviços Agrícolas</h1>
          <p className="text-muted-foreground mt-1">Gerencie os serviços agrícolas (defensivos)</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo
        </Button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        searchKeys={['crop_name', 'culture_name', 'field_name', 'type_operation_name']}
        searchPlaceholder="Buscar serviço agrícola..."
        actions={(item) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Ordem de Serviço" onClick={() => navigate(`/entries/agricultural/defensives/order/${item.id}`)}>
              <FileText className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Fechar O.S." onClick={() => setClosingOrderId(String(item.id))}>
              <CheckSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowEditForm(true); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      {/* Modal Novo */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Novo Serviço Agrícola</DialogTitle>
          </DialogHeader>
          <DefensiveServiceForm
            item={null}
            onSave={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={showEditForm} onOpenChange={(open) => { setShowEditForm(open); if (!open) setEditItem(null); }}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Serviço Agrícola</DialogTitle>
          </DialogHeader>
          {editItem && (
            <DefensiveServiceEditForm
              item={editItem}
              onSave={() => { setShowEditForm(false); setEditItem(null); }}
              onCancel={() => setShowEditForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <DefensiveOrderClosingDialog
        orderId={closingOrderId}
        open={!!closingOrderId}
        onOpenChange={(open) => { if (!open) setClosingOrderId(null); }}
      />

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
