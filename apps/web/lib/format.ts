const nf = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 });

/** 1850 → "1.850" */
export function n(value: number): string {
  return nf.format(Math.round(value));
}

/** 874 → "874 kr" */
export function kr(value: number): string {
  return `${n(value)} kr`;
}
