import { cn } from '@/lib/utils';

type WithChildren = {
  children?: React.ReactNode;
  className?: string;
};

export const PageContainer = ({ children, className }: WithChildren) => {
  return <div className={cn('w-full space-y-5 px-3 py-4 sm:space-y-6 sm:p-6', className)}>{children}</div>;
};

export const PageHeader = ({ children, className }: WithChildren) => {
  return <div className={cn('flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>{children}</div>;
};

export const PageHeaderContent = ({ children, className }: WithChildren) => {
  return <div className={cn('w-full space-y-1', className)}>{children}</div>;
};

export const PageTitle = ({ children, className }: WithChildren) => {
  return <div className={cn('text-muted-foreground text-xl sm:text-2xl', className)}>{children}</div>;
};

export const PageDescription = ({ children, className }: WithChildren) => {
  return <div className={cn('text-muted-foreground text-sm', className)}>{children}</div>;
};

export const PageActions = ({ children, className }: WithChildren) => {
  return <div className={cn('flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end', className)}>{children}</div>;
};

export const PageContent = ({ children, className }: WithChildren) => {
  return <div className={cn('space-y-5 sm:space-y-6', className)}>{children}</div>;
};
