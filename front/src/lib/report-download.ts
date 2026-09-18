import api from './api';

/**
 * PDFs são gerados pelo backend. Buscamos como blob autenticado, abrimos e
 * revogamos a URL temporária.
 */
export async function fetchReportPdf(
  endpoint: string,
  params: Record<string, string | number>,
): Promise<Blob> {
  const { data } = await api.get(endpoint, { params, responseType: 'blob' });
  return data as Blob;
}

export function openPdfBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function downloadReportPdf(
  endpoint: string,
  params: Record<string, string | number>,
  fileName: string,
): Promise<void> {
  const blob = await fetchReportPdf(endpoint, params);
  openPdfBlob(blob, fileName);
}
