const DEFAULT_TIMEOUT_MS = 120000;
const BLOB_URL_TTL_MS = 120000;
const TOKEN_PAGE = '__PDF_PAGE__';
const TOKEN_PAGES = '__PDF_PAGES__';

// ---------- Logo / imágenes en caché ----------
const imageCache = new Map<string, Promise<string>>();

export function getCachedImageBase64(url: string): Promise<string> {
  let cached = imageCache.get(url);
  if (!cached) {
    cached = fetch(url)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );
    cached.catch(() => imageCache.delete(url));
    imageCache.set(url, cached);
  }
  return cached;
}

// ---------- pdfmake en el hilo principal (fallback, carga diferida) ----------
let pdfMakePromise: Promise<any> | null = null;

function loadPdfMake(): Promise<any> {
  if (!pdfMakePromise) {
    pdfMakePromise = Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts'),
    ]).then(([pm, fonts]: any[]) => {
      const pdfMake = pm.default ?? pm;
      const f = fonts.default ?? fonts;
      pdfMake.vfs = f.pdfMake?.vfs ?? f.vfs ?? fonts.vfs;
      return pdfMake;
    });
    pdfMakePromise.catch(() => (pdfMakePromise = null));
  }
  return pdfMakePromise;
}

async function buildOnMainThread(docDefinition: any): Promise<Blob> {
  const pdfMake = await loadPdfMake();
  return new Promise<Blob>((resolve, reject) => {
    try {
      pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => resolve(blob));
    } catch (e) {
      reject(e);
    }
  });
}

// ---------- Serialización del documento para el Web Worker ----------
// header/footer se evalúan con marcadores de página; el resto de funciones (layouts) viajan como texto.
function serializeDoc(doc: any): string {
  const copy = { ...doc };
  for (const key of ['header', 'footer'] as const) {
    if (typeof copy[key] === 'function') {
      const tree = copy[key](TOKEN_PAGE, TOKEN_PAGES, { width: 595.28, height: 841.89 });
      copy[key] = { __tpl: JSON.stringify(tree) };
    }
  }
  return JSON.stringify(copy, (_k, v) =>
    typeof v === 'function' ? { __fn: v.toString() } : v
  );
}

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (b: Blob) => void; reject: (e: any) => void }>();

function getWorker(): Worker {
  if (!worker) {
    const w = new Worker(new URL('./pdf.worker', import.meta.url), { type: 'module' });
    w.onmessage = (ev: MessageEvent) => {
      const { id, blob, error } = ev.data;
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      error ? p.reject(new Error(error)) : p.resolve(blob);
    };
    w.onerror = (ev) => {
      const err = new Error(ev.message || 'Error en el worker de PDF');
      pending.forEach((p) => p.reject(err));
      pending.clear();
      w.terminate();
      worker = null;
    };
    worker = w;
  }
  return worker;
}

const WORKER_TIMEOUT_MS = 20000;

function buildInWorker(docDefinition: any): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      reject(new Error('Worker no disponible'));
      return;
    }
    try {
      const id = ++seq;
      const json = serializeDoc(docDefinition);
      const timer = window.setTimeout(() => {
        pending.delete(id);
        worker?.terminate();
        worker = null;
        reject(new Error('El worker no respondió'));
      }, WORKER_TIMEOUT_MS);
      pending.set(id, {
        resolve: (b) => { clearTimeout(timer); resolve(b); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      getWorker().postMessage({ id, doc: json });
    } catch (e) {
      reject(e);
    }
  });
}

async function buildPdfBlob(docDefinition: any): Promise<Blob> {
  try {
    return await buildInWorker(docDefinition);
  } catch (err) {
    console.warn('[PDF] Worker no disponible, usando hilo principal:', err);
    return buildOnMainThread(docDefinition);
  }
}

// ---------- API pública ----------
export async function openPdfWithoutBlocking(
  docDefinition: any,
  fileName = 'reporte.pdf',
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<void> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error('La generación del PDF tardó demasiado. Inténtalo nuevamente.')),
      timeoutMs
    );
  });

  let blob: Blob;
  try {
    blob = await Promise.race([buildPdfBlob(docDefinition), timeout]);
  } finally {
    clearTimeout(timeoutId);
  }

  const blobUrl = URL.createObjectURL(blob);
  const popup = window.open(blobUrl, '_blank', 'noopener,noreferrer');

  if (!popup) {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  window.setTimeout(() => URL.revokeObjectURL(blobUrl), BLOB_URL_TTL_MS);
}
