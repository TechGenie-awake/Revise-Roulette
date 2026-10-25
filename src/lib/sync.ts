// Local-first sync: the app always works from on-device state; when signed in,
// changes are pushed shortly after they happen and the latest copy is pulled
// whenever the app comes back to the foreground (e.g. switching iPad → phone).
import { create } from 'zustand';
import { createAuthClient } from 'better-auth/react';
import { mergeState, type SyncState } from './merge';
import { useStore } from './store';

export const authClient = createAuthClient({ baseURL: window.location.origin });

type Status = 'off' | 'syncing' | 'synced' | 'error' | 'offline';

export const useSyncStatus = create<{ status: Status; lastSyncAt: number | null }>(() => ({ status: 'off', lastSyncAt: null }));

function localState(): SyncState {
  const s = useStore.getState();
  return { plan: s.plan, progress: s.progress, sessions: s.sessions, resetAt: s.resetAt };
}

let applying = false;
let inflight = false;
let again = false;
let timer: ReturnType<typeof setTimeout> | undefined;

async function syncNow(): Promise<void> {
  if (inflight) {
    again = true;
    return;
  }
  inflight = true;
  useSyncStatus.setState({ status: 'syncing' });
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localState()),
    });
    if (res.status === 401) {
      useSyncStatus.setState({ status: 'off' });
      return;
    }
    if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
    const remote = (await res.json()) as SyncState;
    // Merge with what's local *now*, in case she tapped something while the request was in flight
    applying = true;
    useStore.getState().applyRemote(mergeState(localState(), remote));
    applying = false;
    useSyncStatus.setState({ status: 'synced', lastSyncAt: Date.now() });
  } catch {
    applying = false;
    useSyncStatus.setState({ status: navigator.onLine ? 'error' : 'offline' });
  } finally {
    inflight = false;
    if (again) {
      again = false;
      schedule(300);
    }
  }
}

function schedule(delay = 1200) {
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), delay);
}

/** Starts syncing for the signed-in user; returns a stop function */
export function startSync(): () => void {
  void syncNow();
  const unsubscribe = useStore.subscribe((s, prev) => {
    if (applying) return;
    if (s.plan !== prev.plan || s.progress !== prev.progress || s.sessions !== prev.sessions || s.resetAt !== prev.resetAt) schedule();
  });
  const onVisible = () => document.visibilityState === 'visible' && void syncNow();
  const onOnline = () => void syncNow();
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', onOnline);
  const poll = setInterval(() => document.visibilityState === 'visible' && void syncNow(), 120_000);

  return () => {
    unsubscribe();
    clearTimeout(timer);
    clearInterval(poll);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('online', onOnline);
    useSyncStatus.setState({ status: 'off' });
  };
}

let configPromise: Promise<{ google: boolean } | null> | null = null;
/** null means the API isn't reachable (sign-in unavailable) */
export function getServerConfig(): Promise<{ google: boolean } | null> {
  configPromise ??= fetch('/api/config')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return configPromise;
}
