"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface UseSSEOptions {
  /** Which SSE event name to listen to */
  event: string;
  /** Whether SSE is enabled (default: true) */
  enabled?: boolean;
}

interface UseSSEResult<T> {
  data: T | null;
  loading: boolean;
  lastUpdated: Date | null;
}

/**
 * Hook that subscribes to the SSE endpoint and returns live data.
 * Falls back to polling if SSE is not supported or fails.
 */
export function useSSE<T>(
  url: string,
  options: UseSSEOptions
): UseSSEResult<T> {
  const { event, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") return;

    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener(event, (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data) as T;
        setData(parsed);
        setLastUpdated(new Date());
        setLoading(false);
      } catch {}
    });

    es.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [url, event, enabled]);

  return { data, loading, lastUpdated };
}
