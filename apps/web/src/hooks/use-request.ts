"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface State<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
}

// Runs a fetcher whenever it changes and exposes a manual reload.
// Out-of-order responses are discarded using a sequence counter.
export function useRequest<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true });
  const seq = useRef(0);

  const run = useCallback(() => {
    const id = ++seq.current;
    return fetcher()
      .then((data) => {
        if (id === seq.current) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (id === seq.current) setState((s) => ({ data: s.data, error, loading: false }));
      });
  }, [fetcher]);

  useEffect(() => {
    void run();
  }, [run]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    return run();
  }, [run]);

  return { ...state, reload };
}
