// Fallback data shown when the backend isn't running or ODDS_API_KEY isn't
// configured yet, so the page still demonstrates the real product shape.
// Shape matches exactly what GET /api/picks returns from the live odds feed.

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
}

export const mockPicks = {
  generatedAt: new Date().toISOString(),
  isMock: true,
  freePick: {
    league: "FIFA World Cup",
    match: "Portugal vs DR Congo",
    kickoff: hoursFromNow(3),
    market: "totals",
    selection: "Over",
    label: "Over 2.5 Goals (Total)",
    point: 2.5,
    bookmaker: "Bet365",
    decimalOdds: 1.88,
    impliedProb: 46.66,
    trueProb: 53.34,
    ev: 0.28,
  },
  proBoard: [
    {
      league: "Premier League",
      matches: [
        {
          match: "Man City vs Liverpool",
          kickoff: hoursFromNow(7),
          bets: [
            { market: "h2h", selection: "Man City", label: "Man City to Win (Match Result)", bookmaker: "Bet365", decimalOdds: 2.3, impliedProb: 43.5, trueProb: 49.1, ev: 12.9 },
            { market: "totals", selection: "Over", label: "Over 3.5 Goals (Total)", point: 3.5, bookmaker: "William Hill", decimalOdds: 3.4, impliedProb: 29.4, trueProb: 34.0, ev: 15.6 },
            { market: "spreads", selection: "Liverpool", label: "Liverpool +1.5 (Asian Handicap)", point: 1.5, bookmaker: "Pinnacle", decimalOdds: 1.85, impliedProb: 54.1, trueProb: 58.2, ev: 7.7 },
          ],
        },
        {
          match: "Newcastle vs Aston Villa",
          kickoff: hoursFromNow(9),
          bets: [
            { market: "h2h", selection: "Draw", label: "Draw (Match Result)", bookmaker: "Bet365", decimalOdds: 3.6, impliedProb: 27.8, trueProb: 32.1, ev: 15.5 },
            { market: "totals", selection: "Under", label: "Under 2.5 Goals (Total)", point: 2.5, bookmaker: "Betfair", decimalOdds: 2.1, impliedProb: 47.6, trueProb: 51.3, ev: 7.8 },
            { market: "h2h", selection: "Newcastle", label: "Newcastle to Win (Match Result)", bookmaker: "Pinnacle", decimalOdds: 2.05, impliedProb: 48.8, trueProb: 51.6, ev: 5.7 },
          ],
        },
      ],
    },
    {
      league: "La Liga",
      matches: [
        {
          match: "Real Madrid vs Barcelona",
          kickoff: hoursFromNow(28),
          bets: [
            { market: "totals", selection: "Over", label: "Over 2.5 Goals (Total)", point: 2.5, bookmaker: "Pinnacle", decimalOdds: 1.95, impliedProb: 51.3, trueProb: 57.4, ev: 11.9 },
            { market: "h2h", selection: "Barcelona", label: "Barcelona to Win (Match Result)", bookmaker: "Bet365", decimalOdds: 2.45, impliedProb: 40.8, trueProb: 44.9, ev: 10.0 },
            { market: "spreads", selection: "Real Madrid", label: "Real Madrid -0.5 (Asian Handicap)", point: -0.5, bookmaker: "Betfair", decimalOdds: 2.0, impliedProb: 50.0, trueProb: 53.8, ev: 7.6 },
          ],
        },
      ],
    },
    {
      league: "UEFA Champions League",
      matches: [
        {
          match: "Bayern Munich vs PSG",
          kickoff: hoursFromNow(31),
          bets: [
            { market: "h2h", selection: "Bayern Munich", label: "Bayern Munich to Win (Match Result)", bookmaker: "William Hill", decimalOdds: 2.2, impliedProb: 45.5, trueProb: 51.0, ev: 12.2 },
            { market: "totals", selection: "Over", label: "Over 3.5 Goals (Total)", point: 3.5, bookmaker: "Pinnacle", decimalOdds: 3.1, impliedProb: 32.3, trueProb: 36.5, ev: 13.2 },
            { market: "spreads", selection: "PSG", label: "PSG +0.5 (Asian Handicap)", point: 0.5, bookmaker: "Bet365", decimalOdds: 1.92, impliedProb: 52.1, trueProb: 55.0, ev: 5.6 },
          ],
        },
      ],
    },
  ],
  erroredLeagues: [],
};
