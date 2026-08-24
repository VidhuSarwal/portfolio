'use client';

import { useEffect } from 'react';

// Marks <body> so globals.css can strip this page back to a plain white
// document — native cursor, white background — without touching the
// site-wide rules that every other route still relies on.
export default function LoreChrome() {
  useEffect(() => {
    document.documentElement.dataset.lore = 'true';
    return () => { delete document.documentElement.dataset.lore; };
  }, []);

  return null;
}
