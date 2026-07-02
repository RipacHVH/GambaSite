// Shared odds math — used by both the frontend (display/conversion) and the
// backend (EV + no-vig consensus calculation). Keep this file dependency-free
// so it can be imported from a Vite (browser) build and a plain Node ESM script.

export function americanToDecimal(american) {
  const a = Number(american);
  if (!Number.isFinite(a) || a === 0) return null;
  return a > 0 ? 1 + a / 100 : 1 + 100 / Math.abs(a);
}

export function decimalToAmerican(decimal) {
  const d = Number(decimal);
  if (!Number.isFinite(d) || d <= 1) return null;
  return d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1));
}

export function decimalToFractional(decimal) {
  const d = Number(decimal);
  if (!Number.isFinite(d) || d <= 1) return null;
  const value = d - 1;
  const precision = 1000;
  let num = Math.round(value * precision);
  let den = precision;
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(num, den) || 1;
  num = num / divisor;
  den = den / divisor;
  return { num, den };
}

export function fractionalToDecimal(num, den) {
  const n = Number(num);
  const d = Number(den);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
  return 1 + n / d;
}

export function decimalToImpliedProb(decimal) {
  if (!decimal || decimal <= 1) return null;
  return 1 / decimal;
}

export function formatFractional({ num, den }) {
  return `${num}/${den}`;
}

/**
 * De-vig a single bookmaker's full set of outcome prices (decimal odds) for one
 * market on one event, returning each outcome's fair (vig-removed) probability.
 *
 * Uses the POWER method: find k such that Σ (1/dᵢ)^k = 1, fair pᵢ = (1/dᵢ)^k.
 * This corrects the favorite–longshot bias that the naive proportional method
 * (pᵢ / Σp) suffers from — proportional de-vig systematically overestimates
 * longshot probability and underestimates favorites, because bookmakers load
 * more margin onto longshots. Power de-vig removes margin roughly where the
 * book actually put it, giving materially more accurate fair probabilities
 * (and therefore more accurate EV) on 3-way soccer markets.
 * Falls back to proportional if the solver can't converge (degenerate input).
 */
export function devigOutcomes(decimalOddsArray) {
  const implied = decimalOddsArray.map((d) => decimalToImpliedProb(d));
  if (implied.some((p) => p === null)) return null;
  const sum = implied.reduce((a, b) => a + b, 0);
  if (sum <= 0) return null;

  // No overround (or underround) → probabilities are already fair.
  if (Math.abs(sum - 1) < 1e-9) return implied.slice();

  // Bisection on k: f(k) = Σ pᵢ^k − 1 is strictly decreasing in k for pᵢ∈(0,1).
  const f = (k) => implied.reduce((a, p) => a + Math.pow(p, k), 0) - 1;
  let lo = 0.25, hi = 4;
  if (f(lo) < 0 || f(hi) > 0) {
    // Solver range can't bracket a root — degenerate prices; use proportional.
    return implied.map((p) => p / sum);
  }
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid; else hi = mid;
  }
  const k = (lo + hi) / 2;
  const fair = implied.map((p) => Math.pow(p, k));
  const fairSum = fair.reduce((a, b) => a + b, 0);
  return fair.map((p) => p / fairSum); // normalise away residual epsilon
}

// Books whose prices are treated as "sharp" — lowest-margin, most efficient
// soccer pricing (Pinnacle + the exchanges). Matched case-insensitively by
// substring against The Odds API bookmaker titles.
export const SHARP_BOOKS = ["pinnacle", "betfair", "smarkets", "matchbook"];
const SHARP_WEIGHT = 3; // a sharp book counts as 3 votes in the consensus median

export function isSharpBook(title) {
  const t = String(title ?? "").toLowerCase();
  return SHARP_BOOKS.some((s) => t.includes(s));
}

/**
 * Consensus fair probability for one outcome: the MEDIAN de-vigged probability
 * across every bookmaker that priced the full market. Median (not mean) so a
 * single stale or soft-book price can't drag the "true" estimate toward a
 * longshot that's actually just mispriced by one low-liquidity book — a
 * mean would let one outlier inflate EV into nonsense (e.g. a 46.0 longshot
 * "showing" 70%+ EV because exactly one book hasn't updated its line).
 */
export function consensusProbability(perBookFairProbs) {
  const valid = perBookFairProbs.filter((p) => Number.isFinite(p)).sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 === 0 ? (valid[mid - 1] + valid[mid]) / 2 : valid[mid];
}

/**
 * Sharp-weighted consensus: same median idea, but sharp books (Pinnacle,
 * exchanges) count as multiple votes, anchoring the estimate to the most
 * efficient prices while soft books still contribute. entries is
 * [{ fairProb, sharp }].
 */
export function weightedConsensusProbability(entries) {
  const votes = [];
  for (const e of entries) {
    if (!Number.isFinite(e.fairProb)) continue;
    const w = e.sharp ? SHARP_WEIGHT : 1;
    for (let i = 0; i < w; i++) votes.push(e.fairProb);
  }
  return consensusProbability(votes);
}

export function calculateEV(decimalOdds, trueProb) {
  if (!decimalOdds || !Number.isFinite(trueProb)) return null;
  return (trueProb * decimalOdds - 1) * 100;
}
