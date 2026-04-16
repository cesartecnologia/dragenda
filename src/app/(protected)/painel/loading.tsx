import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function PainelLoading() {
  return (
    <PageContainer className="pb-8">
      <PageHeader>
        <PageHeaderContent>
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="mt-3 h-9 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </PageHeaderContent>
        <PageActions>
          <Skeleton className="h-10 w-40 rounded-2xl" />
        </PageActions>
      </PageHeader>

      <PageContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-[1.75rem] border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-5 h-9 w-32" />
                <Skeleton className="mt-3 h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_340px]">
          <Card className="rounded-[1.85rem] border-slate-200 bg-white shadow-sm">
            <CardHeader><Skeleton className="h-6 w-44" /></CardHeader>
            <CardContent><Skeleton className="h-[320px] w-full rounded-2xl" /></CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-[1.85rem] border-slate-200 bg-white shadow-sm">
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 w-full rounded-2xl" />)}
              </CardContent>
            </Card>
            <Card className="rounded-[1.85rem] border-slate-200 bg-white shadow-sm">
              <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[72px] w-full rounded-2xl" />)}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="rounded-[1.85rem] border-slate-200 bg-white shadow-sm">
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((__, rowIndex) => <Skeleton key={rowIndex} className="h-20 w-full rounded-2xl" />)}
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
}
