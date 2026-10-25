import { useEffect, useState, type FormEvent } from 'react';
import { useStore, useToast } from '../lib/store';
import { authClient, getServerConfig, startSync, useSyncStatus } from '../lib/sync';
import { ConfirmModal, Modal } from './ui';

/** Mount once: runs sync while someone is signed in */
export function SyncManager() {
  const { data } = authClient.useSession();
  const userId = data?.user.id;
  useEffect(() => (userId ? startSync() : undefined), [userId]);
  return null;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}

export function AuthModal({ open, onClose, initialMode = 'signup' }: { open: boolean; onClose: () => void; initialMode?: 'signin' | 'signup' }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<{ google: boolean } | null | undefined>(undefined);
  const showToast = useToast((s) => s.show);
  const planName = useStore((s) => s.plan.name);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    void getServerConfig().then(setConfig);
  }, [open, initialMode]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res =
      mode === 'signup'
        ? await authClient.signUp.email({ email, password, name: name.trim() || planName || email.split('@')[0] })
        : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? 'That did not work. Please try again.');
      return;
    }
    onClose();
    showToast(mode === 'signup' ? 'Account created. Your progress is saved ☁️' : 'Signed in. Syncing your progress ☁️');
  };

  const google = () => void authClient.signIn.social({ provider: 'google', callbackURL: window.location.origin + '/' });

  return (
    <Modal open={open} onClose={onClose} label="Sign in">
      <form className="p-5 sm:p-6" onSubmit={submit}>
        <h2 className="text-2xl font-bold">{mode === 'signup' ? 'Save your progress' : 'Welcome back'}</h2>
        <p className="mt-1 text-sm text-ink-soft">Sign in to use the same wheel on your iPad and phone. Anything you've done so far comes with you.</p>

        {config === null ? (
          <p className="mt-5 rounded-xl border-2 border-ink bg-peach p-3 text-sm font-medium">Sign-in isn't available right now. You can keep using the app; progress stays on this device.</p>
        ) : (
          <>
            {config?.google && (
              <>
                <button type="button" className="nb-btn mt-5 w-full" onClick={google}>
                  <GoogleIcon /> Continue with Google
                </button>
                <div className="my-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  <span className="h-0.5 flex-1 bg-ink/15" /> or <span className="h-0.5 flex-1 bg-ink/15" />
                </div>
              </>
            )}

            <div className={`grid gap-3 ${config?.google ? '' : 'mt-5'}`}>
              {mode === 'signup' && (
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">Name</span>
                  <input className="nb-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={planName || 'Your name'} autoComplete="name" />
                </label>
              )}
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Email</span>
                <input className="nb-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Password</span>
                <input
                  className="nb-input"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
              </label>
            </div>

            {error && <p className="mt-3 rounded-xl border-2 border-ink bg-coral p-2.5 text-sm font-medium">{error}</p>}

            <button type="submit" className="nb-btn mt-5 w-full text-lg" style={{ background: 'var(--color-mint)' }} disabled={busy || config === undefined}>
              {busy ? 'One sec…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
            <p className="mt-4 text-center text-sm text-ink-soft">
              {mode === 'signup' ? 'Already have an account? ' : 'New here? '}
              <button type="button" className="font-semibold text-ink underline underline-offset-4" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); }}>
                {mode === 'signup' ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </>
        )}
      </form>
    </Modal>
  );
}

function syncLabel(status: string, lastSyncAt: number | null): string {
  if (status === 'syncing') return 'Syncing…';
  if (status === 'offline') return "Offline. Will sync when you're back online";
  if (status === 'error') return "Couldn't sync. Will retry";
  if (status === 'synced' && lastSyncAt) return `Synced at ${new Date(lastSyncAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  return 'Connecting…';
}

export function AccountCard() {
  const { data, isPending } = authClient.useSession();
  const { status, lastSyncAt } = useSyncStatus();
  const wipeLocal = useStore((s) => s.wipeLocal);
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);

  if (isPending) return <div className="h-24 animate-pulse rounded-2xl border-2 border-ink/20 bg-paper" />;

  if (!data) {
    return (
      <>
        <p className="text-sm text-ink-soft">Your progress is saved on this device only. Sign in to keep it safe and use it on both your iPad and phone.</p>
        <button className="nb-btn mt-4 w-full" style={{ background: 'var(--color-sky)' }} onClick={() => setAuthOpen(true)}>
          Sign in / Create account
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-lilac font-display text-lg font-bold">
          {(data.user.name || data.user.email).slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="truncate font-semibold">{data.user.email}</div>
          <div className="flex items-center gap-1.5 text-sm text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-full border border-ink" style={{ background: status === 'synced' ? '#3BB273' : status === 'error' ? '#E4572E' : '#F2C14E' }} />
            {syncLabel(status, lastSyncAt)}
          </div>
        </div>
      </div>
      <button className="nb-btn mt-4 w-full" onClick={() => setConfirmOut(true)}>
        Sign out
      </button>
      <ConfirmModal
        open={confirmOut}
        title="Sign out?"
        body="Your progress stays safe in your account. This device goes back to a fresh start until you sign in again."
        confirmLabel="Sign out"
        onClose={() => setConfirmOut(false)}
        onConfirm={async () => {
          await authClient.signOut();
          wipeLocal();
        }}
      />
    </>
  );
}
