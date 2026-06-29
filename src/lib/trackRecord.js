// Track-record math. Profit is measured in UNITS at flat 1-unit stakes:
//   win  → + (decimalOdds - 1)   (a 1.50 winner returns +0.50u, not +1u)
//   loss → - 1
//   void / pending → not counted (break-even / unsettled)
// ROI = profit / total staked (1u per settled bet).
export function computeTrackRecord(rows) {
  const settled = (rows ?? []).filter(r => r.result_won === 1 || r.result_won === 0);
  let profit = 0;
  for (const r of settled) {
    if (r.result_won === 1) profit += (Number(r.decimal_odds) || 1) - 1;
    else profit -= 1;
  }
  const wins = settled.filter(r => r.result_won === 1).length;
  const staked = settled.length; // 1u per bet
  return {
    settledCount: settled.length,
    wins,
    losses: settled.length - wins,
    profit,                                   // net units
    roi: staked ? (profit / staked) * 100 : 0, // %
  };
}

// Per-row profit/loss in units (null when not settled).
export function rowProfit(row) {
  if (row.result_won === 1) return (Number(row.decimal_odds) || 1) - 1;
  if (row.result_won === 0) return -1;
  return null;
}

// "+12.45" / "-3.00" — always signed, 2 decimals.
export function fmtUnits(n) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
}
