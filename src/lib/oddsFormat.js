import {
  americanToDecimal,
  decimalToAmerican,
  decimalToFractional,
  fractionalToDecimal,
} from "../../shared/oddsMath.mjs";

export const ODDS_FORMATS = [
  { id: "american", label: "American", example: "-110" },
  { id: "decimal", label: "Decimal (European)", example: "1.91" },
  { id: "fractional", label: "Fractional (UK)", example: "10/11" },
];

export function formatDecimalOdds(decimal, format) {
  if (!Number.isFinite(decimal)) return "-";

  if (format === "american") {
    const american = decimalToAmerican(decimal);
    return american > 0 ? `+${american}` : `${american}`;
  }

  if (format === "fractional") {
    const frac = decimalToFractional(decimal);
    return frac ? `${frac.num}/${frac.den}` : "-";
  }

  return decimal.toFixed(2);
}

/** Convert a user-entered value in any supported format to decimal odds. */
export function toDecimalOdds(value, format) {
  if (format === "american") return americanToDecimal(value);
  if (format === "fractional") {
    const [num, den] = String(value).split("/").map(Number);
    return fractionalToDecimal(num, den);
  }
  return Number(value);
}
