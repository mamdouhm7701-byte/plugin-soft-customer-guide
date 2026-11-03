'use client';
import { useCallback, useEffect, useState } from 'react';
export class ClientError extends Error {
  status: number;
  details: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export async function api<T = Record<string, unknown>>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');
  const response = await fetch('/api/admin/' + path, { ...options, headers, cache: 'no-store' });
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ClientError(
      response.ok
        ? 'السيرفر رجّع استجابة غير متوقعة. أعد تحميل الصفحة.'
        : 'تعذر الاتصال بالخدمة. حاول مرة أخرى.',
      response.status,
    );
  }
  if (!response.ok) {
    const error =
      data && typeof data === 'object' ? (data as { error?: unknown; details?: unknown }) : {};
    throw new ClientError(
      typeof error.error === 'string' ? error.error : 'تعذر تنفيذ الطلب.',
      response.status,
      error.details,
    );
  }
  return data as T;
}
export function useResource<T>(path: string) {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<{
    path: string;
    tick: number;
    data: T | null;
    error: string;
  } | null>(null);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ path, tick, data, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ path, tick, data: null, error: explain(error) });
      });
    return () => controller.abort();
  }, [path, tick]);
  const current = result?.path === path && result.tick === tick;
  return {
    data: current ? result.data : null,
    error: current ? result.error : '',
    loading: !current,
    reload,
  };
}
export function explain(error: unknown) {
  if (error instanceof ClientError && Array.isArray(error.details)) {
    const extra = error.details
      .map((v) =>
        typeof v === 'string'
          ? v
          : typeof v === 'object' && v && 'message' in v
            ? String(v.message)
            : '',
      )
      .filter(Boolean)
      .join(' ');
    return error.message + (extra ? ' ' + extra : '');
  }
  return error instanceof Error ? error.message : 'تعذر تنفيذ الإجراء.';
}
