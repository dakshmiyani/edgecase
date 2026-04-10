import React from 'react';
import { cn } from '../../lib/utils';

function Badge({ className, variant = 'default', ...props }) {
  const variants = {
    default: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    secondary: 'bg-white/5 text-white/70 border-white/10',
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    destructive: 'bg-red-500/20 text-red-300 border-red-500/30',
    outline: 'bg-transparent text-white/70 border-white/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
