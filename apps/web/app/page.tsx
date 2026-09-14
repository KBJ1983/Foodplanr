'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IconArrow, IconCart, IconChat, IconClose, IconList, IconMenu, IconPlay, IconPlus, IconUser } from '@/components/Icons';
import { priceStrategies } from '@/lib/engine';
import { kr, n } from '@/lib/format';
import { PLANS, STORES, planById } from '@/lib/mock-data';
import { persons, useStore } from '@/lib/store';
import { useOffers } from '@/lib/use-pricing';
import { isoWeekNumber } from '@/lib/week';
import s from './landing.module.css';

const SHOWCASE_STORES = ['rema', 'lidl', 'netto'] as const;

/**
 * Front page (design "forside 1a desktop / 2a mobil"): white page, hero split in
 * magenta text and yellow video panel with a tilted phone, three grey step
 * cards, store chips, blue week-price section with app previews, CTA, footer.
 * Numbers come from the engine for the household's week, not from the mock.
 */
export default function Home() {
  const { state, ready, weekStart } = useStore();
  const offers = useOffers();
  const [menu, setMenu] = useState(false);
  const returning = ready && state.onboarded;
  const pers = ready ? persons(state) : 4;

  const plan = planById('familieuge')!;
  const r = priceStrategies({ plan, persons: pers, weekStart, offers, fixedStores: ready && state.stores.length ? state.stores : SHOWCASE_STORES });
  const cheapest = r.cheapest.total;
  const oneStop = r.fewestStops.total;
  const savedVsOneStop = Math.max(0, Math.round(oneStop - cheapest));
  const perMeal = Math.round(state.weeklyBudget / 7 / Math.max(1, pers));
  const week = isoWeekNumber(weekStart);
  const listGroups = r.cheapest.groups.slice(0, 2);

  const startHref = returning ? '/planer' : '/onboarding/1';
  const startLabel = returning ? 'Mine planer' : 'Start med 5 spørgsmål';

  return (
    <main className={s.page}>
      {/* Nav */}
      <nav className={s.nav} aria-label="Forside">
        <Link href="/" className={s.logo}>
          foodplanr
        </Link>
        <a href="#saadan" className={s.link}>
          Sådan virker det
        </a>
        <Link href="/arkiv" className={s.link}>
          Madplaner
        </Link>
        <a href="#butikker" className={s.link}>
          Butikker
        </a>
        <a href="#priser" className={s.link}>
          Priser
        </a>
        <span className={s.spacer} />
        <Link href="/planer" className={s.iconLink}>
          <IconUser /> Log ind
        </Link>
        <Link href="/onboarding/1" className={`${s.btn} ${s.btnBlack}`}>
          <IconPlus /> Opret gratis
        </Link>
        <button type="button" className={s.burger} aria-label={menu ? 'Luk menu' : 'Åbn menu'} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          {menu ? <IconClose /> : <IconMenu />}
        </button>
        {menu && (
          <div className={s.menu} role="menu">
            <a href="#saadan" onClick={() => setMenu(false)}>
              Sådan virker det
            </a>
            <Link href="/arkiv">Madplaner</Link>
            <a href="#butikker" onClick={() => setMenu(false)}>
              Butikker
            </a>
            <a href="#priser" onClick={() => setMenu(false)}>
              Priser
            </a>
            <Link href="/onboarding/1" className={`${s.btn} ${s.btnA}`}>
              <IconPlus /> Opret gratis
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroText}>
          <p className={`mono ${s.mono}`}>Madplan efter dine butikker</p>
          <div>
            <p className={s.heroNum}>5</p>
            <p className={s.heroH1}>
              <span>spørgsmål,</span> så har I ugens madplan og indkøbsliste pr. butik.
            </p>
          </div>
          <p className={s.heroP}>Billigst, færrest stop eller dine faste butikker. Alt regnet ud for jer.</p>
          <div className={s.heroBtns}>
            <Link href={startHref} className={`${s.btn} ${s.btnWhite}`}>
              {startLabel} <IconArrow />
            </Link>
            <Link href="/arkiv" className={s.btn2}>
              <IconList size={18} /> Se alle madplaner
            </Link>
          </div>
        </div>
        <div className={s.video} aria-label="Video: fra svar til indkøbsliste (kommer)">
          <div className={s.phone} aria-hidden="true">
            <div className={s.phoneInner}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>foodplanr</span>
                <span style={{ opacity: 0.8 }}>3 / 5</span>
              </div>
              <span className={`mono ${s.mono}`}>Budget pr. uge</span>
              <p className={s.phoneNum}>
                {n(state.weeklyBudget)}
                <small> kr</small>
              </p>
              <span style={{ opacity: 0.85, lineHeight: 1.35 }}>
                ≈ {perMeal} kr pr. måltid for {pers} personer.
              </span>
              <div className={s.phoneBar}>
                <i style={{ width: `${((state.weeklyBudget - 500) / 1000) * 100}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                <span>500</span>
                <span>1.000</span>
                <span>1.500</span>
              </div>
              <div className={s.phoneBtns}>
                <span style={{ border: '2px solid #fff' }}>←</span>
                <span style={{ background: '#fff', color: 'var(--a-dark)' }}>Råvarer →</span>
              </div>
            </div>
          </div>
          <div className={s.play} aria-hidden="true">
            <IconPlay />
          </div>
          <span className={s.cap}>
            video: 40 sek.<span className={s.capTail}> – fra svar til indkøbsliste</span>
          </span>
          <div className={s.badge}>
            Uge {week} · {kr(r.preferred.total)} · {pers} pers.
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className={s.section} id="saadan">
        <div className={s.sectionHead}>
          <p className={s.h2}>Tre trin. Ingen opskrifts-jagt.</p>
          <span className={s.sub}>Ca. 2 min. fra svar til liste</span>
        </div>
        <div className={s.cards}>
          <div className={s.card}>
            <div className={s.cardHead}>
              <span className={s.icon}>
                <IconChat />
              </span>
              <span className={`mono ${s.mono}`}>Trin 1</span>
            </div>
            <p className={s.h3}>Svar på 5 spørgsmål</p>
            <p className={s.cardP}>Personer, butikker, budget, råvarer, kalorier.</p>
          </div>
          <div className={s.card}>
            <div className={s.cardHead}>
              <span className={s.icon}>
                <IconList size={20} />
              </span>
              <span className={`mono ${s.mono}`}>Trin 2</span>
            </div>
            <p className={s.h3}>Vælg en madplan</p>
            <p className={s.cardP}>{PLANS.length} egne planer i arkivet nu, puljen vokser. Filtrer på pris, børn, tid.</p>
          </div>
          <div className={s.card}>
            <div className={s.cardHead}>
              <span className={s.icon}>
                <IconCart />
              </span>
              <span className={`mono ${s.mono}`}>Trin 3</span>
            </div>
            <p className={s.h3}>Handl smart</p>
            <p className={s.cardP}>Billigst, færrest stop eller faste butikker. Listen er grupperet pr. butik.</p>
          </div>
        </div>
      </section>

      {/* Stores */}
      <section className={s.stores} id="butikker">
        <p className={`mono ${s.mono}`}>Priser fra</p>
        <div className={s.storeRow}>
          {STORES.map((st) => (
            <span key={st.id} className={s.store}>
              {st.name}
            </span>
          ))}
        </div>
      </section>

      {/* Week price */}
      <section className={s.blue} id="priser">
        <div className="col" style={{ gap: 16 }}>
          <p className={s.h2}>Én uge. Én liste. Tre butikker, hvis det er billigst.</p>
          <p className="p" style={{ opacity: 0.85 }}>
            Se hvad ugen koster i hver butik, før du går ud af døren.
          </p>
          <div className={s.nums}>
            <div>
              <p className={s.bigNum}>{n(cheapest)}</p>
              <p className="mono">kr · billigst</p>
            </div>
            <div>
              <p className={s.bigNum}>{n(oneStop)}</p>
              <p className="mono">kr · ét stop</p>
            </div>
            <div>
              <p className={s.bigNum}>{n(savedVsOneStop)}</p>
              <p className="mono">kr sparet</p>
            </div>
          </div>
        </div>
        <div className={s.previews} aria-hidden="true">
          <div className={`${s.ph} ${s.phA}`}>
            <span style={{ opacity: 0.8 }}>Budget pr. uge</span>
            <p className={s.phNum}>{n(state.weeklyBudget)}</p>
            <div className={s.phoneBar} style={{ height: 8 }}>
              <i style={{ width: `${((state.weeklyBudget - 500) / 1000) * 100}%` }} />
            </div>
            <span>≈ {perMeal} kr pr. måltid</span>
          </div>
          <div className={s.ph}>
            <span style={{ opacity: 0.7 }}>
              Indkøbsliste · {r.cheapest.offerLines}/{r.cheapest.lineCount} på tilbud
            </span>
            {listGroups.map((g, gi) => {
              const store = STORES.find((x) => x.id === g.store)!;
              const bg = store.tone === 'a' ? 'var(--a)' : store.tone === 'b' ? 'var(--b)' : 'var(--c)';
              const fg = store.tone === 'a' ? '#fff' : 'var(--ink)';
              return (
                <div key={g.store} className="col" style={{ gap: 0 }}>
                  <div className={s.storeTag} style={{ background: bg, color: fg }}>
                    {store.name} · {kr(g.total)}
                  </div>
                  {g.lines.slice(0, gi === 0 ? 3 : 1).map((l, i, arr) => (
                    <div key={l.ingredientId} className={`${s.li} ${gi === listGroups.length - 1 && i === arr.length - 1 ? s.last : ''}`}>
                      <span>
                        {i === 0 ? '☑' : '☐'} {l.name}
                      </span>
                      <span>{Math.round(l.price)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.cta}>
        <p className={s.h2}>Klar til ugen?</p>
        <div className={s.ctaBtns}>
          <Link href="/onboarding/1" className={`${s.btn} ${s.btnA}`}>
            <IconPlus /> Opret gratis bruger
          </Link>
          <Link href="/planer" className={s.btn2}>
            <IconUser /> Log ind
          </Link>
        </div>
      </section>

      <footer className={s.foot}>
        <span>foodplanr</span>
        <a href="#saadan">Om</a>
        <a href="#priser">Priser</a>
        <a href="mailto:kontakt@foodplanr.dk">Kontakt</a>
        <span className={s.footNote}>Priserne i denne version er egne eksempelpriser. Login og brugere kommer i næste fase.</span>
      </footer>
    </main>
  );
}
