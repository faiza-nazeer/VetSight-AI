import { useCallback, useEffect, useRef, useState } from 'react';

// Runs an async loader on mount (and whenever deps change). Safe against unmounts and out-of-order responses.
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const run = useRef(0);

  const load = useCallback(async () => {
    const id = ++run.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loader();
      if (id === run.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === run.current) setState((s) => ({ ...s, loading: false, error }));
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
    return () => { run.current += 1; };
  }, [load]);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload: load, setData };
}
