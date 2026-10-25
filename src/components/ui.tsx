import { useEffect, type ReactNode } from 'react';
import { CHAPTER_BY_NO } from '../data/ophthalmology';
import { TIER_COLOR, TIER_LABEL } from '../lib/plan';
import type { Tier } from '../lib/types';

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className="nb-chip" style={{ background: TIER_COLOR[tier] }}>
      {TIER_LABEL[tier]}
    </span>
  );
}

export function ChapterChip({ chapter, short = false }: { chapter: number; short?: boolean }) {
  const c = CHAPTER_BY_NO[chapter];
  return (
    <span className="nb-chip max-w-full" style={{ background: c.color }}>
      <span className="truncate">{short ? `Ch ${c.no}` : `Ch ${c.no} · ${c.name}`}</span>
    </span>
  );
}

export function ProgressBar({ value, color = 'var(--color-mint)', height = 14 }: { value: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div
      className="w-full overflow-hidden rounded-full border-2 border-ink bg-paper"
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full border-r-2 border-ink transition-[width] duration-500"
        style={{ width: `${pct}%`, background: color, borderRightWidth: pct === 0 || pct === 100 ? 0 : 2 }}
      />
    </div>
  );
}

export function Modal({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade items-end justify-center bg-ink/45 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className="nb-card max-h-[92dvh] w-full max-w-lg animate-sheet overflow-y-auto rounded-b-none pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-b-[20px] sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} label={title}>
      <div className="p-5">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="mt-2 text-ink-soft">{body}</div>
        <div className="mt-5 flex gap-3">
          <button className="nb-btn flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            className="nb-btn flex-1"
            style={{ background: danger ? 'var(--color-coral)' : 'var(--color-mint)' }}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

type IconName = 'wheel' | 'list' | 'chart' | 'gear' | 'play' | 'pause' | 'plus' | 'check' | 'lock' | 'close' | 'clock' | 'share' | 'search';

const PATHS: Record<IconName, ReactNode> = {
  wheel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  play: <path d="M7 4.5v15l12-7.5z" fill="currentColor" />,
  pause: <path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m4.5 12.5 5 5L19.5 7" />,
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  share: <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
};

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
