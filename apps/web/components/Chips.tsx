'use client';

export function ChipToggle({ label, on, onToggle, variant }: { label: string; on: boolean; onToggle: () => void; variant?: 'inverse' | 'outline' }) {
  const cls = ['chip', variant === 'outline' ? 'outline' : ''].join(' ');
  const style = variant === 'inverse' && on ? { background: '#fff', color: 'var(--a-dark)' } : undefined;
  return (
    <button type="button" className={cls} aria-pressed={on} onClick={onToggle} style={style}>
      {label}
    </button>
  );
}

export function Counter({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="counter" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Færre ${label}`} disabled={value <= min}>
        −
      </button>
      <span style={{ minWidth: 24, textAlign: 'center' }}>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`Flere ${label}`} disabled={value >= max}>
        +
      </button>
    </div>
  );
}

export function Slider({ value, min, max, step, onChange, label, marks }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string; marks: string[] }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="col" style={{ gap: 8 }}>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--pct' as string]: `${pct}%` }}
      />
      <div className="row sb s" style={{ opacity: 0.75 }}>
        {marks.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}
