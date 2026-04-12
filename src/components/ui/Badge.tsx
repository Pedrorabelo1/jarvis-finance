import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string; // hex
  variant?: 'solid' | 'soft';
}

export function Badge({ color = '#3b82f6', variant = 'soft', className, children, ...props }: BadgeProps) {
  if (variant === 'solid') {
    return (
      <span
        className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white', className)}
        style={{ backgroundColor: color }}
        {...props}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ backgroundColor: `${color}20`, color }}
      {...props}
    >
      {children}
    </span>
  );
}
