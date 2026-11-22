// Tiny global toast bus. Any component can call showToast('Saved') and the
// toast appears at the top of the screen for a few seconds, then fades.
// No native dialogs: window.alert / prompt / confirm never show in Safari
// or an in-app WebView, so feedback has to be an on-page toast instead.
export interface ToastItem {
  id: number;
  text: string;
}

type Listener = (t: ToastItem) => void;

const listeners = new Set<Listener>();
let nextId = 1;

export function showToast(text: string): void {
  const item: ToastItem = { id: nextId, text };
  nextId += 1;
  listeners.forEach((l) => l(item));
}

export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
