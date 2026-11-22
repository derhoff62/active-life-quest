import { useEffect, useState } from 'react';
import { subscribeToast, type ToastItem } from '../lib/toast';

/** Fixed toast host, rendered once at the top of the app in App.tsx.
 * A toast shows for 2.6 seconds, then fades. The newest toast replaces
 * the old one, so the screen never fills with stacked messages. */
export default function ToastHost() {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(
    () =>
      subscribeToast((t) => {
        setLeaving(false);
        setToast(t);
      }),
    [],
  );

  useEffect(() => {
    if (!toast) return undefined;
    const hide = window.setTimeout(() => setLeaving(true), 2600);
    const clear = window.setTimeout(() => setToast(null), 3000);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(clear);
    };
  }, [toast]);

  if (!toast) return null;
  return (
    <div className={`toast${leaving ? ' toast-leaving' : ''}`} role="status" aria-live="polite">
      <span aria-hidden="true">✓</span> {toast.text}
    </div>
  );
}
