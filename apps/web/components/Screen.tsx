import type { CSSProperties, ReactNode } from 'react';

export type Tone = 'a' | 'b' | 'c' | 'white';

const BG: Record<Tone, string> = {
  a: 'var(--a)',
  b: 'var(--b)',
  c: 'var(--c)',
  white: 'var(--white)',
};

/**
 * A full-colour screen. The colour carries the screen; no cards, frames or
 * lines (design principle "Plakat"). Magenta screens use white ink.
 */
export function Screen({ tone, children, className = '', style }: { tone: Tone; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <main
      className={`screen ${className}`}
      data-ink={tone === 'a' ? 'white' : undefined}
      style={{ ['--bg' as string]: BG[tone], ...style }}
    >
      {children}
    </main>
  );
}

/** Colour block that adopts a tone's background + ink (used for side panels). */
export function ToneBox({ tone, children, className = '', style }: { tone: Tone; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={className} data-ink={tone === 'a' ? 'white' : undefined} style={{ ['--bg' as string]: BG[tone], background: BG[tone], color: 'var(--fg)', ...style }}>
      {children}
    </div>
  );
}
