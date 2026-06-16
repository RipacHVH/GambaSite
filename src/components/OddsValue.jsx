import { formatDecimalOdds } from "../lib/oddsFormat";
import { useOddsFormat } from "../context/OddsFormatContext";

export default function OddsValue({ decimal, className = "" }) {
  const { format } = useOddsFormat();
  return <span className={className}>{formatDecimalOdds(decimal, format)}</span>;
}
