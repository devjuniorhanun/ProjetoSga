/**
 * Carrega a logomarca configurada como data URL para uso no jsPDF.
 * Qualquer falha (URL ausente, CORS, 404) apenas remove o logo do documento.
 */
const cache = new Map<string, { dataUrl: string; width: number; height: number } | null>();

export interface LoadedLogo {
  dataUrl: string;
  width: number;
  height: number;
  format: 'PNG' | 'JPEG' | 'WEBP';
}

function detectFormat(dataUrl: string): LoadedLogo['format'] {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'PNG';
}

export async function loadLogo(url?: string | null): Promise<LoadedLogo | null> {
  if (!url) return null;
  if (cache.has(url)) {
    const cached = cache.get(url);
    return cached ? { ...cached, format: detectFormat(cached.dataUrl) } : null;
  }
  try {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('logo indisponível');
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const size = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
      img.onerror = () => resolve({ width: 1, height: 1 });
      img.src = dataUrl;
    });
    const value = { dataUrl, ...size };
    cache.set(url, value);
    return { ...value, format: detectFormat(dataUrl) };
  } catch {
    cache.set(url, null);
    return null;
  }
}
