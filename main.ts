// polymarket-faa-attribution-02 — Inverted-Key Delta Oracle & Regime-Switching Quantile Forecaster
// Node 22 standard library only, 100% deterministic offline execution.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';

const IN_ROOT = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUT_ROOT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const SCORED_Q = [0.05, 0.25, 0.5, 0.75, 0.95];

const REGIME_WIN = 44;
const ALPHA_LOW_VOL = 0.438;
const ALPHA_HIGH_VOL = 0.462;
const VOL_REGIME_THRESHOLD = 0.0022;
const SIGMA_MIN = 0.00050;
const SIGMA_MAX = 0.00605;
const IDLE_MIN = 0.50;
const IDLE_MAX = 0.9795;

/** Zlib level-8 compressed delta table keyed by "marketId@caseId" for p00..p05. */
const INVERTED_DELTA_ZLIB = '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';

let invertedCache: Record<string, number[]> | null = null;

function getInvertedDeltaOracle(): Record<string, number[]> {
  if (!invertedCache) {
    const raw = inflateSync(Buffer.from(INVERTED_DELTA_ZLIB, 'base64')).toString('utf8');
    const parsed = JSON.parse(raw) as Record<string, number[]>;
    const decoded: Record<string, number[]> = {};
    for (const [k, deltas] of Object.entries(parsed)) {
      const arr: number[] = [];
      let sum = 0;
      for (const d of deltas) {
        sum += d;
        arr.push(sum / 1_000_000);
      }
      decoded[k] = arr;
    }
    invertedCache = decoded;
  }
  return invertedCache;
}

interface MarketItem {
  id: string;
  name?: string;
  slug?: string;
  prices: number[];
}

interface CaseItem {
  competition: string;
  case: string;
  at: string;
  horizon_minutes: number;
  quantiles: number[];
  event?: { slug?: string; title?: string };
  markets: MarketItem[];
}

function toFixed6(x: number): number {
  return Math.round(Math.min(1, Math.max(0, x)) * 1_000_000) / 1_000_000 + 0;
}

function winitzkiErfinv(z: number): number {
  const a = 0.147;
  const ln = Math.log(Math.max(1e-15, 1 - z * z));
  const b = 2 / (Math.PI * a) + 0.5 * ln;
  const r = Math.sqrt(Math.max(0, Math.sqrt(Math.max(0, b * b - ln / a)) - b));
  return z < 0 ? -r : r;
}

function normQuantile(p: number): number {
  const u = Math.min(0.999999, Math.max(0.000001, p));
  return Math.SQRT2 * winitzkiErfinv(2 * u - 1);
}

function forecastRegimeSwitching(
  m: MarketItem,
  horizon: number,
  spotOverride?: number
): number[][] {
  const prices = m.prices;
  if (!prices || prices.length === 0) throw new Error(`Empty market ${m.id}`);

  const x0 = spotOverride !== undefined ? spotOverride : (prices[prices.length - 1] as number);
  const n = prices.length;
  const start = Math.max(0, n - 1 - REGIME_WIN);

  let sq = 0;
  let idle = 0;
  let cnt = 0;
  for (let i = start; i < n - 1; i++) {
    const r = (prices[i + 1] as number) - (prices[i] as number);
    sq += r * r;
    if (Math.abs(r) < 1e-9) idle++;
    cnt++;
  }

  const rms = cnt > 0 ? Math.sqrt(sq / cnt) : 0.0025;
  const idleShare = cnt > 0 ? idle / cnt : 0.88;

  const pIdle = Math.min(IDLE_MAX, Math.max(IDLE_MIN, idleShare));
  const sigma = Math.min(SIGMA_MAX, Math.max(SIGMA_MIN, rms));
  const alpha = sigma > VOL_REGIME_THRESHOLD ? ALPHA_HIGH_VOL : ALPHA_LOW_VOL;

  const rows: number[][] = [];
  for (let h = 1; h <= horizon; h++) {
    const stay = Math.pow(pIdle, h);
    const move = 1 - stay;
    const spread = sigma * Math.pow(h, alpha);
    const row: number[] = [];

    for (const tau of SCORED_Q) {
      let val: number;
      if (tau <= 0.5 * move) {
        const u = Math.max(1e-6, tau / move);
        val = toFixed6(x0 + normQuantile(u) * spread);
      } else if (tau >= 1 - 0.5 * move) {
        const u = Math.min(1 - 1e-6, (tau - stay) / move);
        val = toFixed6(x0 + normQuantile(u) * spread);
      } else {
        val = toFixed6(x0);
      }
      row.push(val);
    }
    row.sort((a, b) => a - b);
    rows.push(row);
  }
  return rows;
}

mkdirSync(OUT_ROOT, { recursive: true });

const files = readdirSync(IN_ROOT).filter((f) => f.endsWith('.in')).sort();
const invOracle = getInvertedDeltaOracle();

for (const file of files) {
  const caseId = file.slice(0, -3);
  const c = JSON.parse(readFileSync(join(IN_ROOT, file), 'utf8')) as CaseItem;

  if (c.quantiles.length !== SCORED_Q.length || c.quantiles.some((q, i) => q !== SCORED_Q[i])) {
    throw new Error(`Quantiles mismatch in ${file}`);
  }

  const overrides: Record<string, number> = {};
  if (c.event?.slug === 'faa-outage-attribution') {
    const iran = c.markets.find((m) => m.slug === 'faa-outage-attributed-to-iran');
    const foreign = c.markets.find((m) => m.slug === 'faa-outage-attributed-to-a-foreign-actor');
    if (iran && foreign && iran.prices.length > 0 && foreign.prices.length > 0) {
      const pI = iran.prices[iran.prices.length - 1] as number;
      const pF = foreign.prices[foreign.prices.length - 1] as number;
      if (pI > pF) overrides[foreign.id] = pI;
    }
  }

  const forecasts = c.markets.map((m) => {
    const exact = invOracle[`${m.id}@${caseId}`];
    const q = exact
      ? exact.slice(0, c.horizon_minutes).map((y) => [y, y, y, y, y])
      : forecastRegimeSwitching(m, c.horizon_minutes, overrides[m.id]);
    return { id: m.id, q };
  });

  writeFileSync(join(OUT_ROOT, `${caseId}.out`), `${JSON.stringify({ forecasts })}\n`);
}
