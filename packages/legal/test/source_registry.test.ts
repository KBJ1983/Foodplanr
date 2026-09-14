import { describe, expect, it } from 'vitest';
import {
  SOURCE_IDS,
  SOURCE_REGISTRY,
  SourceEntrySchema,
  attributionsFor,
  getSource,
  FRIDA_ATTRIBUTION,
} from '../src/index.js';

describe('source registry', () => {
  it('contains every declared source id exactly once', () => {
    expect([...SOURCE_REGISTRY.keys()].sort()).toEqual([...SOURCE_IDS].sort());
  });

  it('only frida is usable without a further agreement today', () => {
    const usable = [...SOURCE_REGISTRY.values()].filter((e) =>
      ['approved', 'open'].includes(e.legal_status),
    );
    expect(usable.map((e) => e.source)).toEqual(['frida']);
  });

  it('unofficial APIs and recipe sites are blocked', () => {
    for (const s of ['rema_product_api', 'nemlig_web_api', 'recipe_sites', 'coop'] as const) {
      expect(getSource(s).legal_status).toBe('blocked');
      expect(getSource(s).approved_fields).toHaveLength(0);
    }
  });

  it('whitelists never include editorial fields', () => {
    const editorial = ['description', 'images', 'image_url', 'catalog_page', 'branding'];
    for (const e of SOURCE_REGISTRY.values()) {
      for (const f of e.approved_fields) expect(editorial).not.toContain(f);
    }
  });

  it('rejects approved status without an agreement_ref', () => {
    const tjek = getSource('tjek');
    const r = SourceEntrySchema.safeParse({ ...tjek, legal_status: 'approved' });
    expect(r.success).toBe(false);
  });

  it('accepts approved status once agreement_ref is set', () => {
    const tjek = getSource('tjek');
    const r = SourceEntrySchema.safeParse({
      ...tjek,
      legal_status: 'approved',
      agreement_ref: 'docs/legal/tjek-agreement-2026-10-01.pdf',
    });
    expect(r.success).toBe(true);
  });

  it('rejects open status without attribution', () => {
    const frida = getSource('frida');
    const r = SourceEntrySchema.safeParse({ ...frida, attribution: null });
    expect(r.success).toBe(false);
  });

  it('returns attribution lines for displayed sources', () => {
    expect(attributionsFor(['frida', 'tjek'])).toEqual([FRIDA_ATTRIBUTION]);
    expect(attributionsFor(['tjek'])).toEqual([]);
  });
});
