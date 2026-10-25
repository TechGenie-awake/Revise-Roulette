import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react';

export interface WheelItem {
  id: string;
  label: string;
  color: string;
  weight: number;
  again?: boolean;
}

export interface WheelHandle {
  spin: () => void;
}

interface Props {
  items: WheelItem[];
  centerLabel: string;
  ref?: Ref<WheelHandle>;
  onSpinStart?: () => void;
  onLand: (id: string) => void;
  /** Fires whenever a new slice passes under the pointer */
  onPass?: (id: string) => void;
}

interface Slice {
  item: WheelItem;
  start: number;
  sweep: number;
}

const R = 96;
const LABEL_R = 89;

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
}

function slicePath(start: number, sweep: number): string {
  const [x1, y1] = polar(R, start);
  const [x2, y2] = polar(R, start + sweep);
  const large = sweep > 180 ? 1 : 0;
  return `M0 0 L${x1.toFixed(3)} ${y1.toFixed(3)} A${R} ${R} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}Z`;
}

function sliceAt(slices: Slice[], rotation: number): Slice {
  // The pointer sits at 12 o'clock; find which slice is under it after rotating the wheel
  const a = (((-rotation % 360) + 360) % 360);
  return slices.find((s) => a >= s.start && a < s.start + s.sweep) ?? slices[slices.length - 1];
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

export function Wheel({ items, centerLabel, ref, onSpinStart, onLand, onPass }: Props) {
  const groupRef = useRef<SVGGElement>(null);
  const rotation = useRef(0);
  const spinning = useRef(false);
  const raf = useRef(0);
  const callbacks = useRef({ onSpinStart, onLand, onPass });
  callbacks.current = { onSpinStart, onLand, onPass };

  const slices = useMemo<Slice[]>(() => {
    const total = items.reduce((sum, i) => sum + i.weight, 0) || 1;
    let acc = 0;
    return items.map((item) => {
      const sweep = (item.weight / total) * 360;
      const slice = { item, start: acc, sweep };
      acc += sweep;
      return slice;
    });
  }, [items]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useEffect(() => {
    if (slices.length) callbacks.current.onPass?.(sliceAt(slices, rotation.current).item.id);
  }, [slices]);

  const apply = (deg: number) => groupRef.current?.setAttribute('transform', `rotate(${deg})`);

  useImperativeHandle(
    ref,
    () => ({
      spin() {
        if (spinning.current || slices.length === 0) return;
        const total = slices.reduce((sum, s) => sum + s.item.weight, 0);
        let pick = Math.random() * total;
        const winner = slices.find((s) => (pick -= s.item.weight) < 0) ?? slices[slices.length - 1];

        // Land somewhere inside the winning slice, away from its edges
        const target = winner.start + winner.sweep * (0.2 + Math.random() * 0.6);
        const from = rotation.current;
        const delta = (((-target - from) % 360) + 360) % 360;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const to = from + delta + 360 * (reduced ? 1 : 6);
        const duration = reduced ? 1200 : 5200;
        const t0 = performance.now();
        let lastId = sliceAt(slices, from).item.id;

        spinning.current = true;
        callbacks.current.onSpinStart?.();

        const frame = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 4);
          const deg = from + (to - from) * eased;
          apply(deg);
          const current = sliceAt(slices, deg).item.id;
          if (current !== lastId) {
            lastId = current;
            callbacks.current.onPass?.(current);
          }
          if (p < 1) {
            raf.current = requestAnimationFrame(frame);
          } else {
            rotation.current = to % 360;
            apply(rotation.current);
            spinning.current = false;
            callbacks.current.onLand(winner.item.id);
          }
        };
        raf.current = requestAnimationFrame(frame);
      },
    }),
    [slices],
  );

  return (
    // Height cap keeps the Spin button on screen on iPad landscape
    <div className="relative mx-auto aspect-square w-full max-w-[min(88vw,30rem,max(16rem,calc(100dvh-22rem)))] lg:max-w-[min(34rem,max(18rem,calc(100dvh-20rem)))]">
      <svg
        viewBox="-100 -100 200 200"
        className="h-full w-full overflow-visible drop-shadow-[5px_5px_0_var(--color-ink)]"
        role="img"
        aria-label={`Wheel with ${items.length} topics`}
      >
        <circle r={R + 2} fill="var(--color-paper)" />
        <g ref={groupRef} transform={`rotate(${rotation.current})`}>
          {slices.length === 1 ? (
            <circle r={R} fill={slices[0].item.color} stroke="var(--color-ink)" strokeWidth={0.8} />
          ) : (
            slices.map((s) => (
              <path
                key={s.item.id}
                d={slicePath(s.start, s.sweep)}
                fill={s.item.color}
                stroke="var(--color-ink)"
                strokeWidth={0.8}
                strokeLinejoin="round"
              />
            ))
          )}
          {slices.map((s) => {
            const mid = s.start + s.sweep / 2;
            const chord = slices.length === 1 ? 40 : 2 * 66 * Math.sin(Math.min(s.sweep, 90) * (Math.PI / 360));
            const size = Math.min(7.2, chord * 0.62);
            if (size < 3.4) return null;
            const maxChars = Math.floor(64 / (size * 0.56));
            const text = truncate(`${s.item.again ? '↺ ' : ''}${s.item.label}`, maxChars);
            // Keep text upright: slices on the left half read from the rim inward
            const flip = mid > 180;
            return (
              <text
                key={`${s.item.id}-label`}
                transform={flip ? `rotate(${mid + 90}) translate(${-LABEL_R} 0)` : `rotate(${mid - 90}) translate(${LABEL_R} 0)`}
                textAnchor={flip ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={size}
                fontWeight={600}
                fontFamily="var(--font-display)"
                fill="var(--color-ink)"
                style={{ pointerEvents: 'none' }}
              >
                {text}
              </text>
            );
          })}
        </g>
        <circle r={R} fill="none" stroke="var(--color-ink)" strokeWidth={3} />
        {Array.from({ length: 24 }, (_, i) => {
          const [x, y] = polar(R + 0.2, i * 15);
          return <circle key={i} cx={x} cy={y} r={1.1} fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth={0.6} />;
        })}
        <circle r={19} fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth={2.5} />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          y={-3}
          fontSize={11}
          fontWeight={700}
          fontFamily="var(--font-display)"
          fill="var(--color-ink)"
        >
          {centerLabel}
        </text>
        <text textAnchor="middle" dominantBaseline="central" y={8} fontSize={5} fontWeight={600} fill="var(--color-muted)">
          left
        </text>
      </svg>
      {/* Pointer */}
      <svg viewBox="0 0 40 44" className="absolute left-1/2 top-[-4%] w-[11%] -translate-x-1/2" aria-hidden="true">
        <path d="M4 4 H36 L20 40 Z" fill="var(--color-rose)" stroke="var(--color-ink)" strokeWidth={4} strokeLinejoin="round" />
      </svg>
    </div>
  );
}
