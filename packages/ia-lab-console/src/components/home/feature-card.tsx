'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  details?: string[];
}

export function FeatureCard({ icon: Icon, title, description, color, details }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'group relative p-6 rounded-2xl border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-800',
        'transition-all duration-500 ease-out',
        'hover:shadow-2xl hover:-translate-y-2',
        'hover:border-transparent',
        'overflow-hidden'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient background on hover */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-500',
          'bg-gradient-to-br',
          color,
          'group-hover:opacity-5'
        )}
      />

      {/* Animated border gradient */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500',
          'group-hover:opacity-100'
        )}
        style={{
          background: `linear-gradient(135deg, ${color.includes('brand') ? '#0ea5e9' : color.includes('purple') ? '#a855f7' : color.includes('green') ? '#22c55e' : '#f59e0b'} 0%, transparent 50%)`,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />

      {/* Icon */}
      <div
        className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
          'transition-all duration-500',
          'bg-gray-100 dark:bg-gray-700',
          'group-hover:scale-110 group-hover:rotate-3',
          isHovered && 'bg-gradient-to-br ' + color
        )}
      >
        <Icon
          className={cn(
            'w-7 h-7 transition-colors duration-500',
            'text-gray-600 dark:text-gray-400',
            isHovered && 'text-white'
          )}
        />
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold mb-2 transition-colors group-hover:text-brand-600">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {description}
      </p>

      {/* Expandable details */}
      {details && (
        <div
          className={cn(
            'mt-4 space-y-2 overflow-hidden transition-all duration-500',
            isHovered ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
          <ul className="space-y-1 pt-2">
            {details.map((detail, i) => (
              <li
                key={i}
                className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-2"
                style={{
                  animation: isHovered ? `fade-in-up 0.3s ease-out ${i * 0.1}s forwards` : undefined,
                  opacity: isHovered ? undefined : 0,
                }}
              >
                <span className="w-1 h-1 rounded-full bg-brand-500" />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Decorative corner */}
      <div
        className={cn(
          'absolute -bottom-12 -right-12 w-24 h-24 rounded-full',
          'bg-gradient-to-br opacity-0 transition-all duration-500',
          color,
          'group-hover:opacity-10 group-hover:-bottom-8 group-hover:-right-8'
        )}
      />
    </div>
  );
}
