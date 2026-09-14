/**
 * Small dependency-free CSV parser: auto-detects `;` vs `,`, handles quoted
 * fields with embedded delimiters/newlines and doubled quotes, strips BOM.
 * Good enough for Frida's export (a few hundred thousand rows).
 */
export function detectDelimiter(headerLine: string): ';' | ',' | '\t' {
  const counts: Record<';' | ',' | '\t', number> = {
    ';': (headerLine.match(/;/g) ?? []).length,
    ',': (headerLine.match(/,/g) ?? []).length,
    '\t': (headerLine.match(/\t/g) ?? []).length,
  };
  return (Object.entries(counts) as [';' | ',' | '\t', number][]).sort((a, b) => b[1] - a[1])[0]![0];
}

export function parseCsv(text: string, delimiter?: ';' | ',' | '\t'): Record<string, string>[] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const firstNl = src.indexOf('\n');
  const delim = delimiter ?? detectDelimiter(firstNl === -1 ? src : src.slice(0, firstNl));

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  const [header, ...body] = rows;
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return body.map((cells) => {
    const obj: Record<string, string> = {};
    keys.forEach((k, idx) => {
      obj[k] = (cells[idx] ?? '').trim();
    });
    return obj;
  });
}
