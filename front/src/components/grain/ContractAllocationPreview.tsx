import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatWeightKg } from '@/lib/grain-format';
import { generatesParentAndSubtickets } from '@/lib/grain-rules';
import type { AvailableContractsPreview } from '@/types/grain';
import { AlertTriangle, Info } from 'lucide-react';

interface Props {
  preview: AvailableContractsPreview;
}

/** Prévia FIFO calculada pelo backend. O frontend apenas apresenta. */
export function ContractAllocationPreview({ preview }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-3">
          <p className="text-sm text-muted-foreground">Peso líquido comercial</p>
          <p className="text-xl font-semibold">{formatWeightKg(preview.commercial_net_weight)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-sm text-muted-foreground">Saldo faltante</p>
          <p className={`text-xl font-semibold ${preview.missing_weight > 0 ? 'text-destructive' : ''}`}>
            {formatWeightKg(preview.missing_weight ?? 0)}
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contrato</TableHead>
            <TableHead>Peso alocado</TableHead>
            <TableHead>Saldo do contrato</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.allocations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Nenhum contrato disponível para esta expedição.
              </TableCell>
            </TableRow>
          ) : (
            preview.allocations.map((a) => (
              <TableRow key={a.grain_contract_id}>
                <TableCell className="font-medium">{a.contract_number ?? a.grain_contract_id}</TableCell>
                <TableCell>{formatWeightKg(a.allocated_weight)}</TableCell>
                <TableCell>{a.available_weight != null ? formatWeightKg(a.available_weight) : '-'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {(preview.notices ?? []).map((notice, i) => (
        <Alert key={i}>
          <Info className="h-4 w-4" />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ))}

      {!preview.can_close && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Não é possível fechar: faltam {formatWeightKg(preview.missing_weight ?? 0)} de saldo transferido
            para contratos deste comprador.
          </AlertDescription>
        </Alert>
      )}

      {generatesParentAndSubtickets(preview) && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            O contrato mais antigo será finalizado e o peso restante seguirá para o próximo contrato. A
            operação gera um ticket principal com subtickets, um por contrato utilizado.
          </AlertDescription>
        </Alert>
      )}

      {preview.requires_authorization && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            A carga será dividida em mais de um contrato e depende de autorização administrativa.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
