import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageContainer, PageContent, PageHeader, PageHeaderContent } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingFuncionariosPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <Skeleton className="h-8 w-32" />
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
}
