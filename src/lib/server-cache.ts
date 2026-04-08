type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const globalStore = globalThis as typeof globalThis & {
  __clinicSmartCache?: Map<string, CacheEntry<unknown>>;
};

const store = globalStore.__clinicSmartCache ?? new Map<string, CacheEntry<unknown>>();
globalStore.__clinicSmartCache = store;

export async function withServerCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = store.get(key);
  if (existing && existing.expiresAt > now) return existing.value as T;

  const value = await loader();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function invalidateServerCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }

  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
