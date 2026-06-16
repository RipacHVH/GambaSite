import { decimalToImpliedProb, calculateEV as calcEV } from "../../shared/oddsMath.mjs";

export function calculateEV({ decimalOdds, trueProbabilityPct }) {
  const p = Number(trueProbabilityPct) / 100;
  if (!decimalOdds || decimalOdds <= 1 || !Number.isFinite(p) || p <= 0 || p >= 1) return null;

  const impliedProb = decimalToImpliedProb(decimalOdds);
  const evPct = calcEV(decimalOdds, p);
  const edgePct = (p - impliedProb) * 100;

  return {
    impliedProb: impliedProb * 100,
    evPct,
    edgePct,
    isPositiveEV: evPct > 0,
  };
}

export function calculateArbitrage({ decimalA, decimalB, totalStake }) {
  const stake = Number(totalStake);
  if (!decimalA || decimalA <= 1 || !decimalB || decimalB <= 1 || !Number.isFinite(stake) || stake <= 0)
    return null;

  const impliedA = 1 / decimalA;
  const impliedB = 1 / decimalB;
  const impliedSum = impliedA + impliedB;

  const stakeA = (stake * impliedA) / impliedSum;
  const stakeB = (stake * impliedB) / impliedSum;

  const payoutA = stakeA * decimalA;
  const payoutB = stakeB * decimalB;
  const guaranteedPayout = Math.min(payoutA, payoutB);
  const profit = guaranteedPayout - stake;
  const arbPct = (1 - impliedSum) * 100;

  return {
    impliedSum: impliedSum * 100,
    arbPct,
    stakeA,
    stakeB,
    profit,
    roiPct: (profit / stake) * 100,
    isArbitrage: arbPct > 0,
  };
}
