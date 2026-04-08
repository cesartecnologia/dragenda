'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  paramName?: string;
  placeholder: string;
  initialValue?: string;
  preserveParams?: string[];
};

export default function DebouncedSearchForm({
  paramName = 'q',
  placeholder,
  initialValue = '',
  preserveParams = [],
}: Props) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const baseParams = useMemo(() => {
    const params = new URLSearchParams();
    preserveParams.forEach((key) => {
      const currentValue = searchParams.get(key);
      if (currentValue) params.set(key, currentValue);
    });
    return params;
  }, [preserveParams, searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(baseParams.toString());
      const normalized = value.trim();
      if (normalized) params.set(paramName, normalized);
      const queryString = params.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
      const currentQuery = searchParams.toString();
      const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;
      if (nextUrl === currentUrl) return;
      router.replace(nextUrl, { scroll: false });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [baseParams, paramName, pathname, router, searchParams, value]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} />
      </div>
      {value ? (
        <Button type="button" variant="outline" onClick={() => setValue('')}>
          <X className="mr-2 size-4" />Limpar
        </Button>
      ) : null}
    </div>
  );
}
