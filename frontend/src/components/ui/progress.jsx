import React from 'react';
import { cn } from '../../lib/utils';

const Progress = React.forwardRef(({ className, value = 0, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-violet-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  return (
    <div
      ref={ref}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]', className)}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-out',
          variants[variant]
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
});

Progress.displayName = 'Progress';

export { Progress };
