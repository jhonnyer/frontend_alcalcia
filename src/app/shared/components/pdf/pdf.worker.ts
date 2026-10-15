/// <reference lib="webworker" />

const TOKEN_PAGE = '__PDF_PAGE__';
const TOKEN_PAGES = '__PDF_PAGES__';

let pdfMakePromise: Promise<any> | null = null;

function loadPdfMake(): Promise<any> {
  if (!pdfMakePromise) {
    // pdfmake espera `window`; debe existir antes de evaluar el módulo.
    (self as any).window = self;
    pdfMakePromise = Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts'),
    ]).then(([pm, fonts]: any[]) => {
      const pdfMake = pm.default ?? pm;
      const f = fonts.default ?? fonts;
      pdfMake.vfs = f.pdfMake?.vfs ?? f.vfs ?? fonts.vfs;
      return pdfMake;
    });
  }
  return pdfMakePromise;
}

function toFunction(src: string): Function {
  try {
    return new Function(`return (${src});`)();
  } catch {
    // Método abreviado: `name(args) { ... }`
    const obj = new Function(`return ({ ${src} });`)();
    return Object.values(obj)[0] as Function;
  }
}

function revive(doc: any): any {
  const result = JSON.parse(doc, (_k, v) => {
    if (v && typeof v === 'object' && typeof v.__fn === 'string') return toFunction(v.__fn);
    return v;
  });
  for (const key of ['header', 'footer']) {
    const tpl = result[key]?.__tpl;
    if (typeof tpl === 'string') {
      result[key] = (page: number, pages: number) =>
        JSON.parse(tpl.split(TOKEN_PAGES).join(String(pages)).split(TOKEN_PAGE).join(String(page)));
    }
  }
  return result;
}

addEventListener('message', async (ev: MessageEvent) => {
  const { id, doc } = ev.data;
  try {
    const pdfMake = await loadPdfMake();
    const definition = revive(doc);
    pdfMake.createPdf(definition).getBlob((blob: Blob) => postMessage({ id, blob }));
  } catch (e: any) {
    postMessage({ id, error: e?.message ?? String(e) });
  }
});
