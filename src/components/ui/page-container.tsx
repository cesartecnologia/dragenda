import { cn } from '@/lib/utils';

type WithChildren = {
  children?: React.ReactNode;
  className?: string;
};

export const PageContainer = ({ children, className }: WithChildren) => {
  return <div className={cn('w-full space-y-6 px-4 py-4 md:px-6 md:py-6', className)}>{children}</div>;
};

export const PageHeader = ({ children, className }: WithChildren) => {
  return <div className={cn('flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', className)}>{children}</div>;
};

export const PageHeaderContent = ({ children, className }: WithChildren) => {
  return <div className={cn('w-full space-y-1.5', className)}>{children}</div>;
};

export const PageTitle = ({ children, className }: WithChildren) => {
  return <div className={cn('text-2xl font-semibold tracking-[-0.03em] text-slate-900 md:text-[2rem]', className)}>{children}</div>;
};

export const PageDescription = ({ children, className }: WithChildren) => {
  return <div className={cn('max-w-2xl text-sm text-slate-500', className)}>{children}</div>;
};

export const PageActions = ({ children, className }: WithChildren) => {
  return <div className={cn('flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end', className)}>{children}</div>;
};

export const PageContent = ({ children, className }: WithChildren) => {
  return <div className={cn('space-y-6', className)}>{children}</div>;
};
