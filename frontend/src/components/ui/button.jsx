import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/25',
  destructive: 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/25',
  outline: 'border border-white/10 bg-transparent hover:bg-white/5 text-white',
  secondary: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
  ghost: 'hover:bg-white/5 text-white/70 hover:text-white',
  link: 'text-violet-400 underline-offset-4 hover:underline',
  glow: 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-violet-500/30 transition-shadow',
};

const sizes = {
  default: 'h-10 px-5 py-2',
  sm: 'h-8 px-3 text-sm',
  lg: 'h-12 px-8 text-base',
  icon: 'h-10 w-10',
};

const Button = React.forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'default', 
  asChild = false, 
  ...props 
}, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium',
        'ring-offset-void transition-all duration-200 focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button };
