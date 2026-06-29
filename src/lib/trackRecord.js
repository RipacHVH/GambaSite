// Track record in plain money terms. Assume a $100 bet on every pick:
//   win  → profit of (decimalOdds - 1) × $100   (a 1.50 winner: $100 → $150, i.e. +$50)
//   loss → -$100
//   void / pending → not counted
const STAKE = 100;

export function computeTrackRecord(rows) {
  const settled = (rows ?? []).filter(r => r.result_won === 1 || r.result_won === 0);
  let profit = 0; // total $ at $100 flat per bet
  for (const r of settled) {
    if (r.result_won === 1) profit += ((Number(r.decimal_odds) || 1) - 1) * STAKE;
    else profit -= STAKE;
  }
  const wins = settled.filter(r => r.result_won === 1).length;
  // What an average $100 bet turned into across the whole record.
  const per100 = settled.length ? Math.round(STAKE + profit / settled.length) : STAKE;
  return {
    settledCount: settled.length,
    wins,
    losses: settled.length - wins,
    profit,   // total dollars
    per100,   // a single $100 bet's average outcome ($100 → $per100)
  };
}

// Dollar profit/loss on a $100 bet for one pick (null when unsettled).
export function rowReturn(row) {
  if (row.result_won === 1) return ((Number(row.decimal_odds) || 1) - 1) * STAKE;
  if (row.result_won === 0) return -STAKE;
  return null;
}

// "+$50" / "-$100"
export function fmtMoney(n) {
  return `${n >= 0 ? "+" : "-"}$${Math.abs(Math.round(n))}`;
}
