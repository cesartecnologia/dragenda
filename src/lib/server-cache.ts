type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const globalStore = globalThis as typeof globalThis & {
  __clinicSmartCache?: Map<string, CacheEntry<unknown>>;
  __clinicSmartPendingCache?: Map<string, Promise<unknown>>;
};

const store = globalStore.__clinicSmartCache ?? new Map<string, CacheEntry<unknown>>();
const pendingStore = globalStore.__clinicSmartPendingCache ?? new Map<string, Promise<unknown>>();
globalStore.__clinicSmartCache = store;
globalStore.__clinicSmartPendingCache = pendingStore;

export async function withServerCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = store.get(key);
  if (existing && existing.expiresAt > now) return existing.value as T;

  const pending = pendingStore.get(key);
  if (pending) return pending as Promise<T>;

  const promise = loader()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      pendingStore.delete(key);
      return value;
    })
    .catch((error) => {
      pendingStore.delete(key);
      throw error;
    });

  pendingStore.set(key, promise);
  return promise;
}

export function invalidateServerCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    pendingStore.clear();
    return;
  }

  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }

  for (const key of [...pendingStore.keys()]) {
    if (key.startsWith(prefix)) pendingStore.delete(key);
  }
}
