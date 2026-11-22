import { useEffect, useState } from "react";

type State<T> = { url: string; data?: T; error?: string; status?: number };

// Fetches a URL and returns { data, error, status, loading }. Pass null to skip.
export function useApi<T>(url: string | null) {
  const [state, setState] = useState<State<T> | null>(null);

  useEffect(() => {
    if (!url) return;
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw Object.assign(new Error(body.error ?? "Request failed"), { status: r.status });
        setState({ url, data: body as T });
      })
      .catch((e) => {
        if (e.name !== "AbortError") setState({ url, error: e.message, status: e.status });
      });
    return () => ctrl.abort();
  }, [url]);

  // ignore results that belong to an older URL
  const current = state && state.url === url ? state : null;
  return { data: current?.data, error: current?.error, status: current?.status, loading: !!url && !current };
}