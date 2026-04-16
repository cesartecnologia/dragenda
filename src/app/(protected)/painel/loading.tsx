import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function PainelLoading() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent className="space-y-3">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-10 w-56 rounded-full" />
          <Skeleton className="h-4 w-80 rounded-full" />
        </PageHeaderContent>
        <PageActions>
          <Skeleton className="h-11 w-44 rounded-2xl" />
        </PageActions>
      </PageHeader>

      <PageContent>
        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 px-6 py-6">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-10 w-36 rounded-full" />
                <Skeleton className="h-4 w-52 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="flex items-center justify-between gap-4 px-5 py-5">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
                <Skeleton className="size-11 rounded-2xl" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2.1fr)_360px]">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-44 rounded-full" />
              <Skeleton className="h-4 w-72 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[320px] w-full rounded-[24px]" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36 rounded-full" />
              <Skeleton className="h-4 w-44 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-[22px]" />
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageContainer>
  );
}
