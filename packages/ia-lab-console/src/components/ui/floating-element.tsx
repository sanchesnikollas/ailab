'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
}

export function FloatingElement({
  children,
  className,
  delay = 0,
  duration = 3,
  distance = 10,
}: FloatingElementProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={cn('transition-transform', className)}
      style={{
        animation: mounted
          ? `float ${duration}s ease-in-out ${delay}s infinite`
          : undefined,
        '--float-distance': `${distance}px`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
