"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface UsePollingOptions {
  interval?: number;
  enabled?: boolean;
}

interface UsePollingResult<T> {
  data: T | null;
  loading: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function usePolling<T>(
  url: string,
  options: UsePollingOptions = {}
): UsePollingResult<T> {
  const { interval = 3000, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      if (mountedRef.current) {
        setData(json);
        setLastUpdated(new Date());
        setLoading(false);
      }
    } catch {
      // silently ignore fetch errors during polling
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    fetchData();
    const timer = setInterval(fetchData, interval);

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [fetchData, interval, enabled]);

  return { data, loading, lastUpdated, refresh: fetchData };
}
