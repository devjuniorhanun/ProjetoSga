export function formatReportDateTime(value = new Date()): string {
  const date = value.toLocaleDateString('pt-BR');
  const time = value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${date} às ${time}`;
}

export function reportFooterText(value = new Date()): string {
  return `Sisdeve • www.sisdeve.com.br • Gerado em ${formatReportDateTime(value)}`;
}
