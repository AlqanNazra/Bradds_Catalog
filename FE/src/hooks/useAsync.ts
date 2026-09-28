import { useCallback, useEffect, useState } from 'react';
import { toErrorMessage } from '../types/api';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface AsyncSnapshot<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface AsyncKey {
  loader: () => Promise<unknown>;
  nonce: number;
  fallbackMessage: string;
}

export function useAsync<T>(loader: () => Promise<T>, fallbackMessage: string): AsyncState<T> {
  const [snapshot, setSnapshot] = useState<AsyncSnapshot<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const [nonce, setNonce] = useState(0);
  const [key, setKey] = useState<AsyncKey>({ loader, nonce, fallbackMessage });
  if (key.loader !== loader || key.nonce !== nonce || key.fallbackMessage !== fallbackMessage) {
    setKey({ loader, nonce, fallbackMessage });
    setSnapshot((current) => ({ ...current, loading: true, error: null }));
  }
  useEffect(() => {
    let cancelled = false;
    loader()
      .then((result) => {
        if (!cancelled) setSnapshot({ data: result, loading: false, error: null });
      }).catch((reason: unknown) => {
        if (cancelled) return;
        setSnapshot({ data: null, loading: false, error: toErrorMessage(reason, fallbackMessage) });
      });
    return () => {
      cancelled = true;
    };
  }, [loader, nonce, fallbackMessage]);
  const reload = useCallback(() => setNonce((value) => value + 1), []);
  return { data: snapshot.data, loading: snapshot.loading, error: snapshot.error, reload };
}
