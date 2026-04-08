'use client';

import { useEffect } from 'react';

export default function AutoPrint() {
  useEffect(() => {
    const trigger = () => window.print();
    const timer = window.setTimeout(trigger, 350);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
