import { attributionsFor, type SourceId } from '@madplan/legal';

/** Required wherever data from an attributed source is shown (brief §11). */
export function Attribution({ sources }: { sources: SourceId[] }) {
  const lines = attributionsFor(sources);
  if (lines.length === 0) return null;
  return (
    <footer className="s" style={{ fontSize: 10, opacity: 0.55, marginTop: 8 }}>
      {lines.map((l) => (
        <p key={l} style={{ margin: 0 }}>
          Næringsdata: {l}
        </p>
      ))}
    </footer>
  );
}
