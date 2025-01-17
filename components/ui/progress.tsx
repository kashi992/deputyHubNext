'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

export type ProgressElement = React.ElementRef<typeof ProgressPrimitive.Root>;
export type ProgressProps = React.ComponentPropsWithoutRef<
  typeof ProgressPrimitive.Root
>;
const Progress = React.forwardRef<ProgressElement, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="size-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
