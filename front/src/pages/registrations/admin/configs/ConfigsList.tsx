import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useRoles } from '@/contexts/RolesContext';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { configsService, Config } from '@/lib/api-services-admin';
import { useCrud } from '@/hooks/use-crud';
import { Pencil, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfigForm } from './ConfigForm';
import { ConfigLogoCard } from './ConfigLogoCard';

function ColorSwatch({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-5 w-5 rounded border border-border" style={{ backgroundColor: value }} />
      <span className="text-sm">{value}</span>
    </div>
  );
}

export default function ConfigsList() {
  const { hasRole } = useRoles();
  const { data, isLoading } = useCrud<Config>('admin-configs', configsService);
  const [editItem, setEditItem] = useState<Config | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<Config | null>(null);

  const columns = [
    { key: 'producer_name', label: 'Nome do Produtor' },
    { key: 'property_name', label: 'Nome da Propriedade' },
    { key: 'producer_color', label: 'Cor do Produtor', render: (item: Config) => <ColorSwatch value={item.producer_color} /> },
    { key: 'property_color', label: 'Cor da Propriedade', render: (item: Config) => <ColorSwatch value={item.property_color} /> },
  ];

  if (!hasRole('SUPER', 'ADM')) return <Navigate to="/" replace />;

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-1">Gerencie as configurações do sistema</p>
        </div>
      </div>

      {data[0] && <ConfigLogoCard config={data[0]} />}

      <DataTable data={data} columns={columns} searchKeys={['producer_name', 'property_name']} searchPlaceholder="Buscar configuração..."
        actions={(item) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
          </div>
        )}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Nova'} Configuração</DialogTitle></DialogHeader>
          <ConfigForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes da Configuração</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div><span className="text-sm text-muted-foreground">Nome do Produtor:</span><p className="font-medium">{viewItem.producer_name}</p></div>
              <div><span className="text-sm text-muted-foreground">Nome da Propriedade:</span><p className="font-medium">{viewItem.property_name}</p></div>
              <div><span className="text-sm text-muted-foreground">Cor do Produtor:</span><ColorSwatch value={viewItem.producer_color} /></div>
              <div><span className="text-sm text-muted-foreground">Cor da Propriedade:</span><ColorSwatch value={viewItem.property_color} /></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
