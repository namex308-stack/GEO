/**
 * Resolve `promise` or return `fallback` when it rejects or exceeds `ms`.
 * Used so auth/network hangs cannot freeze CTA navigation or login.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const guarded = Promise.resolve(promise).catch(() => fallback);
  return Promise.race([
    guarded,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}
