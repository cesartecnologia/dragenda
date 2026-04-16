import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function PainelLoading() {
  return (
    <PageContainer className="pb-8">
      <PageHeader>
        <PageHeaderContent>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-72" />
        </PageHeaderContent>
        <PageActions>
          <Skeleton className="h-10 w-40 rounded-xl" />
        </PageActions>
      </PageHeader>

      <PageContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <Card key={index} className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-2 h-3 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-[280px] w-full" /></CardContent>
          </Card>
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16 w-full rounded-2xl" />)}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageContainer>
  );
}
