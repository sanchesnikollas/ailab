'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface UseCaseCardProps {
  title: string;
  domain: string;
  description: string;
  states: number;
  tools: number;
  image?: string;
  gradient: string;
  slug?: string;
}

export function UseCaseCard({
  title,
  domain,
  description,
  states,
  tools,
  gradient,
  slug,
}: UseCaseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const content = (
    <div
      className={cn(
        'group relative h-full rounded-2xl overflow-hidden',
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'transition-all duration-500',
        'hover:shadow-2xl hover:border-transparent'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient header */}
      <div className={cn('h-32 relative overflow-hidden', gradient)}>
        {/* Animated pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id={`grid-${title}`} width="10" height="10" patternUnits="userSpaceOnUse">
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#grid-${title})`} />
          </svg>
        </div>

        {/* Floating orbs */}
        <div
          className={cn(
            'absolute w-20 h-20 rounded-full bg-white/20 blur-xl',
            'transition-all duration-700',
            isHovered ? 'top-4 right-4 scale-150' : 'top-8 right-8 scale-100'
          )}
        />
        <div
          className={cn(
            'absolute w-12 h-12 rounded-full bg-white/10 blur-lg',
            'transition-all duration-700',
            isHovered ? 'bottom-8 left-4 scale-150' : 'bottom-4 left-8 scale-100'
          )}
        />

        {/* Domain badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
            {domain}
          </span>
        </div>

        {/* Stats badges */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <span className="px-2 py-1 bg-black/20 backdrop-blur-sm text-white text-xs rounded">
            {states} states
          </span>
          <span className="px-2 py-1 bg-black/20 backdrop-blur-sm text-white text-xs rounded">
            {tools} tools
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-2 group-hover:text-brand-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {description}
        </p>

        {/* Action */}
        <div
          className={cn(
            'mt-4 flex items-center gap-2 text-sm font-medium',
            'text-brand-600 transition-all duration-300',
            isHovered ? 'translate-x-2' : ''
          )}
        >
          <span>View manifest</span>
          <ArrowRight className={cn('w-4 h-4 transition-transform', isHovered && 'translate-x-1')} />
        </div>
      </div>
    </div>
  );

  if (slug) {
    return (
      <Link href={`/docs/${slug}`} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
