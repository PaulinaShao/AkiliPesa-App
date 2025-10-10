import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      {...props}
    >
      <defs>
        <linearGradient id="tanzanite-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--gradient-violet)' }} />
          <stop offset="50%" style={{ stopColor: 'var(--gradient-sapphire)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--gradient-teal)' }} />
        </linearGradient>
      </defs>
      <path
        d="M50,5 C74.85,5 95,25.15 95,50 C95,74.85 74.85,95 50,95 C25.15,95 5,74.85 5,50 C5,25.15 25.15,5 50,5 Z M50,15 C30.67,15 15,30.67 15,50 C15,69.33 30.67,85 50,85 C69.33,85 85,69.33 85,50 C85,30.67 69.33,15 50,15 Z"
        fill="url(#tanzanite-gradient)"
      />
      <path
        d="M50 25 L 75 75 L 65 75 L 56 55 L 44 55 L 35 75 L 25 75 Z M 50 35 L 59 55 L 41 55 Z"
        transform="translate(0, -5)"
        fill="white"
      />
    </svg>
  );
}
