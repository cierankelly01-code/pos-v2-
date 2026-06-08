import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from './supabase';

/**
 * Subscribe to postgres_changes with auto-reconnect and cleanup.
 * Returns connection status: 'connecting' | 'connected' | 'disconnected'
 */
export function useRealtimeSubscription({ channelName, table, onChange, enabled = true }) {
  const [status, setStatus] = useState('connecting');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const stableOnChange = useCallback(() => {
    onChangeRef.current?.();
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    let channel = null;
    let retryTimer = null;
    let cancelled = false;

    const cleanupChannel = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };

    const connect = () => {
      if (cancelled) return;
      cleanupChannel();
      setStatus('connecting');

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => stableOnChange()
        )
        .subscribe((subscriptionStatus) => {
          if (cancelled) return;
          if (subscriptionStatus === 'SUBSCRIBED') {
            setStatus('connected');
          } else if (
            subscriptionStatus === 'CHANNEL_ERROR' ||
            subscriptionStatus === 'TIMED_OUT' ||
            subscriptionStatus === 'CLOSED'
          ) {
            setStatus('disconnected');
            cleanupChannel();
            retryTimer = setTimeout(connect, 5000);
          }
        });
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      cleanupChannel();
    };
  }, [channelName, table, enabled, stableOnChange]);

  return status;
}
