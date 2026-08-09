// Piccoli helper condivisi per l'interfaccia: escape, dialog, toast.

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

let toastTimer = null;
export function toast(msg) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2600);
}

// apre un <dialog> con l'HTML dato; ritorna l'elemento. Si chiude con data-close o ESC.
export function openDialog(html, { onClose } = {}) {
  document.querySelector('dialog.app-dialog')?.remove();
  const dlg = document.createElement('dialog');
  dlg.className = 'app-dialog';
  dlg.innerHTML = html;
  document.body.append(dlg);
  dlg.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) dlg.close();
    // tap sul backdrop
    if (e.target === dlg) {
      const r = dlg.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dlg.close();
    }
  });
  dlg.addEventListener('close', () => { dlg.remove(); onClose?.(); });
  dlg.showModal();
  return dlg;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export async function shareOrCopy(text, title) {
  if (navigator.share) {
    try { await navigator.share({ text, title }); return; } catch { /* annullato */ }
  } else if (await copyText(text)) {
    toast('Copiato negli appunti 📋');
  }
}
