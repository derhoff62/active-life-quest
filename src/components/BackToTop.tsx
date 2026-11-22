// Back to top button for long tabs (Progress, Journey, Workouts).
// Appears once the page is scrolled down, scrolls smoothly to the top.
import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      className="primary"
      aria-label="Back to top"
      style={{ position: 'fixed', right: 16, bottom: 76, zIndex: 50, borderRadius: 999, padding: '10px 16px' }}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      Back to top
    </button>
  );
}
