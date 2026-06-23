/**
 * mockData.js
 * ─────────────────────────────────────────────────────────────
 * Dados falsos que espelham EXATAMENTE a estrutura JSON retornada
 * pelos endpoints da API-Football (v3). Use como referência de
 * shape ao integrar a API real.
 *
 * Endpoints cobertos:
 *  • GET /standings          → MOCK_STANDINGS
 *  • GET /fixtures           → MOCK_FIXTURES  (finalizados + futuros)
 *  • GET /fixtures/statistics→ MOCK_STATISTICS[fixtureId]
 *  • GET /fixtures/headtohead→ MOCK_H2H
 *  • GET /players/topscorers → MOCK_TOPSCORERS
 */

/* ─── CLASSIFICAÇÃO DOS GRUPOS ─────────────────────────────── */
export const MOCK_STANDINGS = {
  response: [
    {
      league: {
        id: 1,
        name: "FIFA World Cup",
        standings: [
          // GRUPO A
          [
            { rank: 1, team: { id: 6,   name: "Brazil",      logo: "" }, points: 9,  goalsDiff: 6,  group: "Group A", form: "WWW", all: { played: 3, win: 3, draw: 0, lose: 0, goals: { for: 7, against: 1 } } },
            { rank: 2, team: { id: 769, name: "Mexico",       logo: "" }, points: 4,  goalsDiff: 1,  group: "Group A", form: "WDL", all: { played: 3, win: 1, draw: 1, lose: 1, goals: { for: 4, against: 3 } } },
            { rank: 3, team: { id: 21,  name: "Colombia",     logo: "" }, points: 2,  goalsDiff: -2, group: "Group A", form: "DLL", all: { played: 3, win: 0, draw: 2, lose: 1, goals: { for: 2, against: 4 } } },
            { rank: 4, team: { id: 102, name: "Cameroon",     logo: "" }, points: 1,  goalsDiff: -5, group: "Group A", form: "LLD", all: { played: 3, win: 0, draw: 1, lose: 2, goals: { for: 1, against: 6 } } },
          ],
          // GRUPO B
          [
            { rank: 1, team: { id: 26,  name: "Argentina",   logo: "" }, points: 7,  goalsDiff: 5,  group: "Group B", form: "WWD", all: { played: 3, win: 2, draw: 1, lose: 0, goals: { for: 6, against: 1 } } },
            { rank: 2, team: { id: 27,  name: "Portugal",    logo: "" }, points: 6,  goalsDiff: 4,  group: "Group B", form: "WWL", all: { played: 3, win: 2, draw: 0, lose: 1, goals: { for: 5, against: 1 } } },
            { rank: 3, team: { id: 24,  name: "Poland",      logo: "" }, points: 3,  goalsDiff: -2, group: "Group B", form: "WLL", all: { played: 3, win: 1, draw: 0, lose: 2, goals: { for: 2, against: 4 } } },
            { rank: 4, team: { id: 56,  name: "Saudi Arabia",logo: "" }, points: 0,  goalsDiff: -7, group: "Group B", form: "LLL", all: { played: 3, win: 0, draw: 0, lose: 3, goals: { for: 0, against: 7 } } },
          ],
          // GRUPO C
          [
            { rank: 1, team: { id: 2,   name: "France",      logo: "" }, points: 6,  goalsDiff: 3,  group: "Group C", form: "WWL", all: { played: 3, win: 2, draw: 0, lose: 1, goals: { for: 4, against: 1 } } },
            { rank: 2, team: { id: 9,   name: "Spain",       logo: "" }, points: 5,  goalsDiff: 2,  group: "Group C", form: "WDW", all: { played: 3, win: 1, draw: 2, lose: 0, goals: { for: 3, against: 1 } } },
            { rank: 3, team: { id: 1569,name: "Morocco",     logo: "" }, points: 4,  goalsDiff: 1,  group: "Group C", form: "WDL", all: { played: 3, win: 1, draw: 1, lose: 1, goals: { for: 2, against: 1 } } },
            { rank: 4, team: { id: 34,  name: "Japan",       logo: "" }, points: 0,  goalsDiff: -6, group: "Group C", form: "LLL", all: { played: 3, win: 0, draw: 0, lose: 3, goals: { for: 0, against: 6 } } },
          ],
          // GRUPO D
          [
            { rank: 1, team: { id: 25,  name: "Germany",     logo: "" }, points: 7,  goalsDiff: 6,  group: "Group D", form: "WWD", all: { played: 3, win: 2, draw: 1, lose: 0, goals: { for: 7, against: 1 } } },
            { rank: 2, team: { id: 13,  name: "Croatia",     logo: "" }, points: 5,  goalsDiff: 2,  group: "Group D", form: "WDW", all: { played: 3, win: 1, draw: 2, lose: 0, goals: { for: 3, against: 1 } } },
            { rank: 3, team: { id: 29,  name: "Morocco",     logo: "" }, points: 2,  goalsDiff: -3, group: "Group D", form: "DLL", all: { played: 3, win: 0, draw: 2, lose: 1, goals: { for: 1, against: 4 } } },
            { rank: 4, team: { id: 1529,name: "Canada",      logo: "" }, points: 0,  goalsDiff: -5, group: "Group D", form: "LLL", all: { played: 3, win: 0, draw: 0, lose: 3, goals: { for: 0, against: 5 } } },
          ],
        ],
      },
    },
  ],
};

/* ─── ARTILHEIROS ───────────────────────────────────────────── */
export const MOCK_TOPSCORERS = {
  response: [
    { player: { id: 874,  name: "Kylian Mbappé",   nationality: "France",   photo: "" }, statistics: [{ goals: { total: 5 }, team: { name: "France"    } }] },
    { player: { id: 154,  name: "Neymar Jr.",       nationality: "Brazil",   photo: "" }, statistics: [{ goals: { total: 4 }, team: { name: "Brazil"    } }] },
    { player: { id: 276,  name: "Cristiano Ronaldo",nationality: "Portugal", photo: "" }, statistics: [{ goals: { total: 4 }, team: { name: "Portugal"  } }] },
    { player: { id: 306,  name: "Lionel Messi",     nationality: "Argentina",photo: "" }, statistics: [{ goals: { total: 3 }, team: { name: "Argentina" } }] },
    { player: { id: 521,  name: "Harry Kane",       nationality: "England",  photo: "" }, statistics: [{ goals: { total: 3 }, team: { name: "England"   } }] },
  ],
};

/* ─── FIXTURES (partidas) ───────────────────────────────────── */
export const MOCK_FIXTURES = {
  response: [
    // ─ FINALIZADAS ─────────────────────────────────────────
    {
      fixture: { id: 10001, date: "2026-06-15T18:00:00+00:00", status: { short: "FT", long: "Match Finished" }, venue: { name: "MetLife Stadium", city: "East Rutherford, NJ" } },
      league:  { round: "Group Stage - 1" },
      teams:   { home: { id: 6,  name: "Brazil",    logo: "", winner: true  }, away: { id: 102, name: "Cameroon",  logo: "", winner: false } },
      goals:   { home: 3, away: 0 },
    },
    {
      fixture: { id: 10002, date: "2026-06-15T21:00:00+00:00", status: { short: "FT", long: "Match Finished" }, venue: { name: "SoFi Stadium", city: "Inglewood, CA" } },
      league:  { round: "Group Stage - 1" },
      teams:   { home: { id: 26, name: "Argentina", logo: "", winner: true  }, away: { id: 56,  name: "Saudi Arabia", logo: "", winner: false } },
      goals:   { home: 2, away: 0 },
    },
    {
      fixture: { id: 10003, date: "2026-06-16T15:00:00+00:00", status: { short: "FT", long: "Match Finished" }, venue: { name: "AT&T Stadium", city: "Arlington, TX" } },
      league:  { round: "Group Stage - 1" },
      teams:   { home: { id: 25, name: "Germany",   logo: "", winner: true  }, away: { id: 1529,name: "Canada",    logo: "", winner: false } },
      goals:   { home: 4, away: 1 },
    },
    {
      fixture: { id: 10004, date: "2026-06-16T18:00:00+00:00", status: { short: "FT", long: "Match Finished" }, venue: { name: "Levi's Stadium", city: "Santa Clara, CA" } },
      league:  { round: "Group Stage - 1" },
      teams:   { home: { id: 2,  name: "France",    logo: "", winner: true  }, away: { id: 34,  name: "Japan",     logo: "", winner: false } },
      goals:   { home: 3, away: 0 },
    },
    {
      fixture: { id: 10005, date: "2026-06-19T18:00:00+00:00", status: { short: "FT", long: "Match Finished" }, venue: { name: "Rose Bowl", city: "Pasadena, CA" } },
      league:  { round: "Group Stage - 2" },
      teams:   { home: { id: 6,  name: "Brazil",    logo: "", winner: true  }, away: { id: 21,  name: "Colombia",  logo: "", winner: false } },
      goals:   { home: 2, away: 1 },
    },
    {
      fixture: { id: 10006, date: "2026-06-20T21:00:00+00:00", status: { short: "FT", long: "Match Finished" }, venue: { name: "Estadio Azteca", city: "Mexico City" } },
      league:  { round: "Group Stage - 2" },
      teams:   { home: { id: 13, name: "Croatia",   logo: "", winner: null  }, away: { id: 29,  name: "Morocco",   logo: "", winner: null  } },
      goals:   { home: 1, away: 1 },
    },
    // ─ FUTURAS ──────────────────────────────────────────────
    {
      fixture: { id: 10007, date: "2026-06-28T18:00:00+00:00", status: { short: "NS", long: "Not Started" }, venue: { name: "MetLife Stadium", city: "East Rutherford, NJ" } },
      league:  { round: "Round of 16" },
      teams:   { home: { id: 6,  name: "Brazil",    logo: "", winner: null }, away: { id: 13,  name: "Croatia",  logo: "", winner: null } },
      goals:   { home: null, away: null },
    },
    {
      fixture: { id: 10008, date: "2026-06-29T21:00:00+00:00", status: { short: "NS", long: "Not Started" }, venue: { name: "SoFi Stadium", city: "Inglewood, CA" } },
      league:  { round: "Round of 16" },
      teams:   { home: { id: 26, name: "Argentina", logo: "", winner: null }, away: { id: 2,   name: "France",   logo: "", winner: null } },
      goals:   { home: null, away: null },
    },
    {
      fixture: { id: 10009, date: "2026-07-03T21:00:00+00:00", status: { short: "NS", long: "Not Started" }, venue: { name: "AT&T Stadium", city: "Arlington, TX" } },
      league:  { round: "Quarter-finals" },
      teams:   { home: { id: 27, name: "Portugal",  logo: "", winner: null }, away: { id: 25,  name: "Germany",  logo: "", winner: null } },
      goals:   { home: null, away: null },
    },
    {
      fixture: { id: 10010, date: "2026-07-14T18:00:00+00:00", status: { short: "NS", long: "Not Started" }, venue: { name: "MetLife Stadium", city: "East Rutherford, NJ" } },
      league:  { round: "Final" },
      teams:   { home: { id: 6,  name: "Brazil",    logo: "", winner: null }, away: { id: 26,  name: "Argentina",logo: "", winner: null } },
      goals:   { home: null, away: null },
    },
  ],
};

/* ─── ESTATÍSTICAS POR FIXTURE ──────────────────────────────── */
export const MOCK_STATISTICS = {
  // Brasil 3 x 0 Camarões
  10001: {
    response: [
      { team: { id: 6,   name: "Brazil"   }, statistics: [
        { type: "Ball Possession", value: "64%" },
        { type: "Total Shots",     value: 21    },
        { type: "Shots on Goal",   value: 9     },
        { type: "Fouls",           value: 10    },
        { type: "Corner Kicks",    value: 8     },
        { type: "Offsides",        value: 4     },
        { type: "Yellow Cards",    value: 1     },
        { type: "Passes",          value: 542   },
        { type: "Pass accuracy",   value: "88%" },
      ]},
      { team: { id: 102, name: "Cameroon" }, statistics: [
        { type: "Ball Possession", value: "36%" },
        { type: "Total Shots",     value: 6     },
        { type: "Shots on Goal",   value: 2     },
        { type: "Fouls",           value: 18    },
        { type: "Corner Kicks",    value: 3     },
        { type: "Offsides",        value: 1     },
        { type: "Yellow Cards",    value: 3     },
        { type: "Passes",          value: 287   },
        { type: "Pass accuracy",   value: "71%" },
      ]},
    ],
  },
  // Argentina 2 x 0 Arábia Saudita
  10002: {
    response: [
      { team: { id: 26, name: "Argentina"    }, statistics: [
        { type: "Ball Possession", value: "59%" },
        { type: "Total Shots",     value: 16    },
        { type: "Shots on Goal",   value: 7     },
        { type: "Fouls",           value: 12    },
        { type: "Corner Kicks",    value: 6     },
        { type: "Offsides",        value: 3     },
        { type: "Yellow Cards",    value: 1     },
        { type: "Passes",          value: 498   },
        { type: "Pass accuracy",   value: "86%" },
      ]},
      { team: { id: 56, name: "Saudi Arabia" }, statistics: [
        { type: "Ball Possession", value: "41%" },
        { type: "Total Shots",     value: 8     },
        { type: "Shots on Goal",   value: 2     },
        { type: "Fouls",           value: 15    },
        { type: "Corner Kicks",    value: 3     },
        { type: "Offsides",        value: 2     },
        { type: "Yellow Cards",    value: 2     },
        { type: "Passes",          value: 341   },
        { type: "Pass accuracy",   value: "78%" },
      ]},
    ],
  },
  // Alemanha 4 x 1 Canada
  10003: {
    response: [
      { team: { id: 25,   name: "Germany" }, statistics: [
        { type: "Ball Possession", value: "61%" },
        { type: "Total Shots",     value: 19    },
        { type: "Shots on Goal",   value: 10    },
        { type: "Fouls",           value: 9     },
        { type: "Corner Kicks",    value: 7     },
        { type: "Offsides",        value: 2     },
        { type: "Yellow Cards",    value: 0     },
        { type: "Passes",          value: 517   },
        { type: "Pass accuracy",   value: "90%" },
      ]},
      { team: { id: 1529, name: "Canada" }, statistics: [
        { type: "Ball Possession", value: "39%" },
        { type: "Total Shots",     value: 10    },
        { type: "Shots on Goal",   value: 3     },
        { type: "Fouls",           value: 14    },
        { type: "Corner Kicks",    value: 4     },
        { type: "Offsides",        value: 3     },
        { type: "Yellow Cards",    value: 2     },
        { type: "Passes",          value: 308   },
        { type: "Pass accuracy",   value: "74%" },
      ]},
    ],
  },
  // França 3 x 0 Japan
  10004: {
    response: [
      { team: { id: 2,  name: "France" }, statistics: [
        { type: "Ball Possession", value: "67%" },
        { type: "Total Shots",     value: 20    },
        { type: "Shots on Goal",   value: 10    },
        { type: "Fouls",           value: 11    },
        { type: "Corner Kicks",    value: 9     },
        { type: "Offsides",        value: 3     },
        { type: "Yellow Cards",    value: 1     },
        { type: "Passes",          value: 561   },
        { type: "Pass accuracy",   value: "89%" },
      ]},
      { team: { id: 34, name: "Japan"  }, statistics: [
        { type: "Ball Possession", value: "33%" },
        { type: "Total Shots",     value: 7     },
        { type: "Shots on Goal",   value: 1     },
        { type: "Fouls",           value: 13    },
        { type: "Corner Kicks",    value: 2     },
        { type: "Offsides",        value: 1     },
        { type: "Yellow Cards",    value: 2     },
        { type: "Passes",          value: 261   },
        { type: "Pass accuracy",   value: "72%" },
      ]},
    ],
  },
  // Brasil 2 x 1 Colômbia
  10005: {
    response: [
      { team: { id: 6,  name: "Brazil"   }, statistics: [
        { type: "Ball Possession", value: "55%" },
        { type: "Total Shots",     value: 15    },
        { type: "Shots on Goal",   value: 7     },
        { type: "Fouls",           value: 14    },
        { type: "Corner Kicks",    value: 6     },
        { type: "Offsides",        value: 2     },
        { type: "Yellow Cards",    value: 2     },
        { type: "Passes",          value: 462   },
        { type: "Pass accuracy",   value: "84%" },
      ]},
      { team: { id: 21, name: "Colombia" }, statistics: [
        { type: "Ball Possession", value: "45%" },
        { type: "Total Shots",     value: 12    },
        { type: "Shots on Goal",   value: 4     },
        { type: "Fouls",           value: 16    },
        { type: "Corner Kicks",    value: 5     },
        { type: "Offsides",        value: 3     },
        { type: "Yellow Cards",    value: 3     },
        { type: "Passes",          value: 378   },
        { type: "Pass accuracy",   value: "80%" },
      ]},
    ],
  },
  // Croácia 1 x 1 Marrocos
  10006: {
    response: [
      { team: { id: 13, name: "Croatia" }, statistics: [
        { type: "Ball Possession", value: "52%" },
        { type: "Total Shots",     value: 13    },
        { type: "Shots on Goal",   value: 4     },
        { type: "Fouls",           value: 13    },
        { type: "Corner Kicks",    value: 5     },
        { type: "Offsides",        value: 2     },
        { type: "Yellow Cards",    value: 1     },
        { type: "Passes",          value: 437   },
        { type: "Pass accuracy",   value: "83%" },
      ]},
      { team: { id: 29, name: "Morocco" }, statistics: [
        { type: "Ball Possession", value: "48%" },
        { type: "Total Shots",     value: 11    },
        { type: "Shots on Goal",   value: 5     },
        { type: "Fouls",           value: 12    },
        { type: "Corner Kicks",    value: 6     },
        { type: "Offsides",        value: 1     },
        { type: "Yellow Cards",    value: 2     },
        { type: "Passes",          value: 401   },
        { type: "Pass accuracy",   value: "82%" },
      ]},
    ],
  },
};

/* ─── HEAD-TO-HEAD (histórico entre seleções) ───────────────── */
// Chave: "teamId1-teamId2" (menor ID primeiro para consistência)
export const MOCK_H2H = {
  // Brasil vs Croácia (IDs: 6 e 13)
  "6-13": {
    response: [
      { fixture: { date: "2022-11-24", status: { short: "FT" } }, teams: { home: { id: 6,  name: "Brazil",  logo: "" }, away: { id: 13, name: "Croatia", logo: "" } }, goals: { home: 0, away: 0 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "2022-12-09", status: { short: "FT" } }, teams: { home: { id: 13, name: "Croatia", logo: "" }, away: { id: 6,  name: "Brazil",  logo: "" } }, goals: { home: 1, away: 1 }, score: { penalty: { home: 4, away: 2 } } },
      { fixture: { date: "2018-06-22", status: { short: "FT" } }, teams: { home: { id: 6,  name: "Brazil",  logo: "" }, away: { id: 13, name: "Croatia", logo: "" } }, goals: { home: 3, away: 0 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "2014-06-12", status: { short: "FT" } }, teams: { home: { id: 6,  name: "Brazil",  logo: "" }, away: { id: 13, name: "Croatia", logo: "" } }, goals: { home: 3, away: 1 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "2006-06-13", status: { short: "FT" } }, teams: { home: { id: 6,  name: "Brazil",  logo: "" }, away: { id: 13, name: "Croatia", logo: "" } }, goals: { home: 1, away: 0 }, score: { penalty: { home: null, away: null } } },
    ],
  },
  // Argentina vs França (IDs: 2 e 26)
  "2-26": {
    response: [
      { fixture: { date: "2022-12-18", status: { short: "FT" } }, teams: { home: { id: 26, name: "Argentina", logo: "" }, away: { id: 2, name: "France", logo: "" } }, goals: { home: 3, away: 3 }, score: { penalty: { home: 4, away: 2 } } },
      { fixture: { date: "2018-06-30", status: { short: "FT" } }, teams: { home: { id: 2,  name: "France",    logo: "" }, away: { id: 26, name: "Argentina", logo: "" } }, goals: { home: 4, away: 3 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "2009-06-11", status: { short: "FT" } }, teams: { home: { id: 26, name: "Argentina", logo: "" }, away: { id: 2, name: "France",    logo: "" } }, goals: { home: 0, away: 0 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "1978-06-06", status: { short: "FT" } }, teams: { home: { id: 26, name: "Argentina", logo: "" }, away: { id: 2, name: "France",    logo: "" } }, goals: { home: 2, away: 1 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "1930-07-15", status: { short: "FT" } }, teams: { home: { id: 2,  name: "France",    logo: "" }, away: { id: 26, name: "Argentina", logo: "" } }, goals: { home: 0, away: 1 }, score: { penalty: { home: null, away: null } } },
    ],
  },
  // Portugal vs Alemanha (IDs: 25 e 27)
  "25-27": {
    response: [
      { fixture: { date: "2021-06-19", status: { short: "FT" } }, teams: { home: { id: 25, name: "Germany",  logo: "" }, away: { id: 27, name: "Portugal", logo: "" } }, goals: { home: 4, away: 2 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "2014-06-16", status: { short: "FT" } }, teams: { home: { id: 25, name: "Germany",  logo: "" }, away: { id: 27, name: "Portugal", logo: "" } }, goals: { home: 4, away: 0 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "2012-03-09", status: { short: "FT" } }, teams: { home: { id: 25, name: "Germany",  logo: "" }, away: { id: 27, name: "Portugal", logo: "" } }, goals: { home: 1, away: 0 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "2011-11-11", status: { short: "FT" } }, teams: { home: { id: 27, name: "Portugal", logo: "" }, away: { id: 25, name: "Germany",  logo: "" } }, goals: { home: 3, away: 1 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "2006-07-08", status: { short: "FT" } }, teams: { home: { id: 25, name: "Germany",  logo: "" }, away: { id: 27, name: "Portugal", logo: "" } }, goals: { home: 3, away: 1 }, score: { penalty: { home: null, away: null } } },
    ],
  },
  // Brasil vs Argentina (Final) — IDs: 6 e 26
  "6-26": {
    response: [
      { fixture: { date: "2021-07-10", status: { short: "FT" } }, teams: { home: { id: 26, name: "Argentina", logo: "" }, away: { id: 6, name: "Brazil", logo: "" } }, goals: { home: 1, away: 0 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "2019-07-02", status: { short: "FT" } }, teams: { home: { id: 6, name: "Brazil",  logo: "" }, away: { id: 26, name: "Argentina", logo: "" } }, goals: { home: 2, away: 0 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "2016-11-11", status: { short: "FT" } }, teams: { home: { id: 26, name: "Argentina", logo: "" }, away: { id: 6, name: "Brazil",  logo: "" } }, goals: { home: 3, away: 0 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "2012-09-12", status: { short: "FT" } }, teams: { home: { id: 6, name: "Brazil",  logo: "" }, away: { id: 26, name: "Argentina", logo: "" } }, goals: { home: 4, away: 3 }, score: { penalty: { home: null, away: null } } },
      { fixture: { date: "2010-09-07", status: { short: "FT" } }, teams: { home: { id: 6, name: "Brazil",  logo: "" }, away: { id: 26, name: "Argentina", logo: "" } }, goals: { home: 0, away: 0 }, score: { penalty: { home: null, away: null } } },
    ],
  },
};
