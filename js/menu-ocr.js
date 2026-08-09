// OCR di menù e scontrini con Tesseract.js.
// Prova prima la copia vendorizzata nel repo (funziona anche offline);
// se manca, ripiega sul CDN jsdelivr.

// URL assoluti: i percorsi relativi dentro un Web Worker si risolverebbero
// rispetto al worker stesso, non alla pagina.
const VENDOR = new URL('vendor/tesseract/', window.location.href).toString();
const CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/';
const CDN_CORE = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/';
const CDN_LANG = 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/ita/4.0.0/';

let loading = null; // Promise<{workerPath, corePath, langPath}>

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => { s.remove(); reject(new Error(`script ${src}`)); };
    document.head.append(s);
  });
}

async function ensureTesseract() {
  if (window.Tesseract) return loading;
  if (!loading) {
    loading = (async () => {
      try {
        await loadScript(`${VENDOR}tesseract.min.js`);
        // verifica che anche worker e lingua vendorizzati esistano
        const probe = await fetch(`${VENDOR}worker.min.js`, { method: 'HEAD' });
        if (!probe.ok) throw new Error('vendor incompleto');
        return {
          workerPath: `${VENDOR}worker.min.js`,
          corePath: VENDOR.replace(/\/$/, ''),
          langPath: VENDOR.replace(/\/$/, ''),
        };
      } catch {
        await loadScript(`${CDN}tesseract.min.js`);
        return {
          workerPath: `${CDN}worker.min.js`,
          corePath: CDN_CORE.replace(/\/$/, ''),
          langPath: CDN_LANG.replace(/\/$/, ''),
        };
      }
    })();
  }
  return loading;
}

// file (o blob/dataURL) → testo. onProgress(0..1) facoltativo.
export async function runOcr(file, onProgress) {
  const paths = await ensureTesseract();
  const worker = await window.Tesseract.createWorker('ita', 1, {
    ...paths,
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(m.progress);
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return data.text || '';
  } finally {
    await worker.terminate();
  }
}
