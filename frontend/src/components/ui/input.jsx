import React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2',
      'text-sm text-white placeholder:text-white/30',
      'backdrop-blur-sm transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      className
    )}
    ref={ref}
    {...props}
  />
));

Input.displayName = 'Input';

export { Input };
