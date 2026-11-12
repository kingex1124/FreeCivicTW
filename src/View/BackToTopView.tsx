'use client';
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 300);
    update();
    document.documentElement.dataset.scrollReady = 'true';
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      delete document.documentElement.dataset.scrollReady;
    };
  }, []);
  return (
    <a className="back-to-top" href="#page-top" aria-label="Top 回到頂端" data-visible={visible}>
      <ArrowUp size={18} aria-hidden="true" />
      <span>Top</span>
    </a>
  );
}
