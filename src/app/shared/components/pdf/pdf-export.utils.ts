const DEFAULT_TIMEOUT_MS = 45000;
const BLOB_URL_TTL_MS = 120000;

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(() => resolve(), 0);
    });
  });
}

export async function openPdfWithoutBlocking(
  pdfMakeInstance: any,
  docDefinition: any,
  fileName = 'reporte.pdf',
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<void> {
  await yieldToBrowser();

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const settleOnce = (cb: () => void) => {
      if (settled) return;
      settled = true;
      cb();
    };

    const timeoutId = window.setTimeout(() => {
      settleOnce(() => reject(new Error('La generación del PDF tardó demasiado. Inténtalo nuevamente.')));
    }, timeoutMs);

    try {
      const pdf = pdfMakeInstance.createPdf(docDefinition);
      pdf.getBlob((blob: Blob) => {
        settleOnce(() => {
          clearTimeout(timeoutId);

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
          resolve();
        });
      });
    } catch (error) {
      settleOnce(() => {
        clearTimeout(timeoutId);
        reject(error);
      });
    }
  });
}
