'use client';

import type { ComponentType } from 'react';

import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type ActionItem = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  hidden?: boolean;
  destructive?: boolean;
};

interface AppointmentRowActionsProps {
  patientName: string;
  actions: ActionItem[];
}

export default function AppointmentRowActions({ patientName, actions }: AppointmentRowActionsProps) {
  const visibleActions = actions.filter((action) => !action.hidden);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60" onCloseAutoFocus={(event) => event.preventDefault()}>
        <DropdownMenuLabel className="truncate">{patientName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.key}
              onSelect={(event) => {
                event.preventDefault();
                action.onClick();
              }}
              className={action.destructive ? 'text-red-600 focus:text-red-700' : undefined}
            >
              <Icon className="mr-2 size-4" />
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
