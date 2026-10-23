/** Accordion Component */

import { cn } from '../../utils/helpers';
import { ChevronDown } from 'lucide-react';
import { forwardRef, type HTMLAttributes, useRef } from 'react';
import { useState } from 'react';

interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, type = 'single', collapsible = false, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {children}
      </div>
    );
  }
);
Accordion.displayName = 'Accordion';

interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden', className)} data-value={value} {...props}>
        {children}
      </div>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

interface AccordionTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const [open, setOpen] = useState(false);

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100',
          'hover:bg-slate-50 dark:hover:bg-slate-800/50',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
          className
        )}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        {...props}
      >
        {children}
        <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform flex-shrink-0 ml-4', open && 'rotate-180')} />
      </button>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const contentRef = useRef<HTMLDivElement | null>(null);

    const handleRef = (el: HTMLDivElement | null) => {
      contentRef.current = el;
      if (ref) {
        if (typeof ref === 'function') ref(el);
        else ref.current = el;
      }
    };

    // This is a simplified version - in production use a proper animation library
    return (
      <div ref={handleRef} className={cn('overflow-hidden transition-all duration-200')} {...props}>
        <div className={cn('px-4 pb-4', className)}>
          {children}
        </div>
      </div>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';