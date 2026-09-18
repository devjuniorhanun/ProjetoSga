import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown } from 'lucide-react';
import type { LegacyImportRelationship } from '@/lib/api-services-imports';

interface LegacyImportRelationshipsProps {
  relationships?: LegacyImportRelationship[];
}

function toChain(item: LegacyImportRelationship): string[] {
  if (item.chain?.length) return item.chain;
  if (item.parent || item.child) {
    return [item.parent, item.child].filter(Boolean) as string[];
  }
  const target = item.label ?? item.entity;
  const deps = Array.isArray(item.depends_on)
    ? item.depends_on
    : item.depends_on
    ? [item.depends_on]
    : [];
  return [...deps, target].filter(Boolean) as string[];
}

export function LegacyImportRelationships({ relationships }: LegacyImportRelationshipsProps) {
  if (!relationships || relationships.length === 0) return null;

  const chains = relationships.map(toChain).filter((chain) => chain.length > 0);
  if (chains.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Relacionamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chains.map((chain, index) => (
            <div key={index} className="rounded-lg border border-border p-4">
              {chain.map((step, stepIndex) => (
                <div key={`${step}-${stepIndex}`}>
                  <p className="text-sm font-medium">{step}</p>
                  {stepIndex < chain.length - 1 && (
                    <ArrowDown className="my-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
