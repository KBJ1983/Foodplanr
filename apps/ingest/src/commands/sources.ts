import { listSources } from '@madplan/legal';

export function sourcesCommand(opts: { json: boolean }): void {
  const rows = listSources();
  if (opts.json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  console.table(
    rows.map((s) => ({
      source: s.source,
      legal_status: s.legal_status,
      fields: s.approved_fields.length,
      agreement_ref: s.agreement_ref ?? '',
      reviewed_at: s.reviewed_at,
    })),
  );
}
