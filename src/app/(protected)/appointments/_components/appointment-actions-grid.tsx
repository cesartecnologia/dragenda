'use client';

import type { ComponentProps } from 'react';

import Link from 'next/link';

import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ButtonVariant = ComponentProps<typeof Button>['variant'];

type AppointmentActionItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
  hidden?: boolean;
};

interface AppointmentActionsGridProps {
  actions: AppointmentActionItem[];
  className?: string;
}

const baseButtonClassName = 'h-auto min-h-12 w-full justify-start rounded-2xl px-4 py-3 text-left shadow-none whitespace-normal';

export default function AppointmentActionsGrid({ actions, className }: AppointmentActionsGridProps) {
  const visibleActions = actions.filter((item) => !item.hidden);

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {visibleActions.map((action) => {
        const Icon = action.icon;
        const iconContainerClassName = action.variant === 'default'
          ? 'bg-white/15 text-current ring-1 ring-inset ring-white/10'
          : 'bg-muted text-current ring-1 ring-inset ring-border/70';

        const content = (
          <span className="flex w-full items-center gap-3">
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', iconContainerClassName)}>
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium leading-5 [overflow-wrap:anywhere]">{action.label}</span>
          </span>
        );

        if (action.href) {
          return (
            <Button
              key={action.key}
              type="button"
              variant={action.variant ?? 'outline'}
              className={cn(baseButtonClassName, action.className)}
              asChild
            >
              <Link href={action.href}>{content}</Link>
            </Button>
          );
        }

        return (
          <Button
            key={action.key}
            type="button"
            variant={action.variant ?? 'outline'}
            className={cn(baseButtonClassName, action.className)}
            onClick={action.onClick}
          >
            {content}
          </Button>
        );
      })}
    </div>
  );
}
