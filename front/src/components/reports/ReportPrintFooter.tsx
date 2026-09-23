import { useMemo } from 'react';
import { reportFooterText } from '@/lib/report-footer';

export function ReportPrintFooter() {
  const text = useMemo(() => reportFooterText(), []);

  return (
    <footer className="fixed inset-x-0 bottom-0 hidden items-center justify-center border-t border-border bg-background pt-1 text-[9px] text-muted-foreground print:flex">
      {text}
    </footer>
  );
}
