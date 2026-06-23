/**
 * views/matches.js — Aba "Jogos"
 * ─────────────────────────────────────────────────────────────
 * Layout de duas colunas:
 *   Esquerda: lista de partidas (finalizadas + futuras)
 *   Direita:  painel de detalhes
 *     • Partida finalizada → Estatísticas + barras de progresso
 *     • Partida futura     → Histórico H2H (head-to-head)
 */

import { fetchFixtures, fetchMatchStats, fetchH2H, fetchStandings, fetchTeamStats2026 } from "../api.js";
import {
  getTeam, showLoader, showError, esc,
  fmtDate, fmtDateShort, parseStatVal, translateRound,
} from "../utils.js";

// Estatísticas que queremos exibir (filtradas do payload da API)
const STAT_LABELS = {
  "Ball Possession":  { label: "Posse de Bola",   unit: "%",  isPercent: true  },
  "Passes":           { label: "Passes",           unit: "",   isPercent: false },
  "Pass accuracy":    { label: "Precisão de Passe",unit: "%",  isPercent: true  },
  "Total Shots":      { label: "Chutes Totais",    unit: "",   isPercent: false },
  "Shots on Goal":    { label: "Chutes no Alvo",   unit: "",   isPercent: false },
  "Fouls":            { label: "Faltas",           unit: "",   isPercent: false },
  "Corner Kicks":     { label: "Escanteios",       unit: "",   isPercent: false },
  "Offsides":         { label: "Impedimentos",     unit: "",   isPercent: false },
  "Yellow Cards":     { label: "Cartões Amarelos", unit: "",   isPercent: false },
  "Red Cards":        { label: "Cartões Vermelhos", unit: "",   isPercent: false },
  "Throw-ins":        { label: "Laterais",         unit: "",   isPercent: false },
};

const STAT_ICONS = {
  "Posse de Bola": "⚽",
  "Gols Feitos por Jogo": "🥅",
  "Gols Sofridos por Jogo": "🛡️",
  "Chutes por Jogo": "👟",
  "Chutes no Alvo por Jogo": "🎯",
  "Chutes Sofridos por Jogo": "🧤",
  "Chutes no Alvo Sofridos por Jogo": "🧤",
  "Escanteios por Jogo": "🚩",
  "Faltas por Jogo": "🛑",
  "Cartões Amarelos por Jogo": "🟨",
  "Cartões Vermelhos por Jogo": "🟥",
  "Impedimentos por Jogo": "🏁",
  "Passes por Jogo": "🔄",
  "Laterais por Jogo": "👐",
  
  // Rótulos de jogo individual (finalizados)
  "Chutes Totais": "👟",
  "Chutes no Alvo": "🎯",
  "Faltas": "🛑",
  "Escanteios": "🚩",
  "Impedimentos": "🏁",
  "Cartões Amarelos": "🟨",
  "Cartões Vermelhos": "🟥",
  "Passes": "🔄",
  "Laterais": "👐",
  "Precisão de Passe": "🎯"
};

/* ─── View principal ─────────────────────────────────────────── */
export async function renderMatches(container) {
  showLoader(container);

  try {
    const data     = await fetchFixtures();
    const fixtures = data.response ?? [];

    const finished = fixtures
      .filter(f => f.fixture.status.short === "FT")
      .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));

    const upcoming = fixtures
      .filter(f => f.fixture.status.short === "NS")
      .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

    container.innerHTML = `
      <div class="view-matches">
        <!-- Coluna esquerda: lista de jogos -->
        <aside class="matches-sidebar" id="matches-sidebar">
          <div class="matches-filter">
            <button class="filter-btn active" id="btn-filter-finished">Jogos Realizados</button>
            <button class="filter-btn" id="btn-filter-upcoming">Ainda vai rolar</button>
          </div>
          <div class="matches-list-container" id="matches-list-container"></div>
        </aside>

        <!-- Coluna direita: painel de detalhes -->
        <section class="match-detail" id="match-detail">
          <div class="match-detail__empty">
            <span class="match-detail__empty-icon">🏟️</span>
            <p>Selecione uma partida ao lado para ver os detalhes.</p>
          </div>
        </section>
      </div>
    `;

    const listContainer = document.getElementById("matches-list-container");
    const btnFinished = document.getElementById("btn-filter-finished");
    const btnUpcoming = document.getElementById("btn-filter-upcoming");

    const updateList = (type) => {
      if (type === "finished") {
        btnFinished.classList.add("active");
        btnUpcoming.classList.remove("active");
        listContainer.innerHTML = renderSection("Finalizados", finished, "FT");
      } else {
        btnFinished.classList.remove("active");
        btnUpcoming.classList.add("active");
        listContainer.innerHTML = renderSection("Próximos Jogos", upcoming, "NS");
      }
      
      bindMatchCards(fixtures);

      const firstCard = listContainer.querySelector(".match-card");
      if (firstCard) {
        firstCard.click();
      } else {
        document.getElementById("match-detail").innerHTML = `
          <div class="match-detail__empty">
            <span class="match-detail__empty-icon">🏟️</span>
            <p>Nenhuma partida encontrada.</p>
          </div>
        `;
      }
    };

    btnFinished.addEventListener("click", () => updateList("finished"));
    btnUpcoming.addEventListener("click", () => updateList("upcoming"));

    // Inicializa com finalizados
    updateList("finished");

  } catch (err) {
    showError(container, err.message ?? "Falha ao carregar os jogos.");
  }
}

/* ── Lista de cards ──────────────────────────────────────────── */

function renderSection(title, fixtures, statusType) {
  if (!fixtures.length) return "";
  return `
    <div class="matches-section">
      <h3 class="matches-section__title">${esc(title)}</h3>
      ${fixtures.map(f => renderMatchCard(f, statusType)).join("")}
    </div>
  `;
}

function renderMatchCard(match, statusType) {
  const { fixture, teams, goals, league } = match;
  const homeTeam = getTeam(teams.home.id);
  const awayTeam = getTeam(teams.away.id);
  const isFinished = statusType === "FT";

  const scoreDisplay = isFinished
    ? `${goals.home ?? 0} – ${goals.away ?? 0}`
    : fmtDateShort(fixture.date);

  const winnerClass = (side) =>
    isFinished && teams[side].winner === true ? "match-card__team--winner" : "";

  return `
    <div
      class="match-card"
      data-id="${fixture.id}"
      data-status="${statusType}"
      data-home-id="${teams.home.id}"
      data-away-id="${teams.away.id}"
      role="button"
      tabindex="0"
      aria-label="${homeTeam.name} vs ${awayTeam.name}"
    >
      <div class="match-card__round">${esc(translateRound(league.round))}</div>
      <div class="match-card__body">
        <div class="match-card__team ${winnerClass("home")}">
          <span class="match-card__flag">${homeTeam.flag}</span>
          <span class="match-card__tname">${esc(homeTeam.abbr)}</span>
        </div>
        <div class="match-card__score">${esc(scoreDisplay)}</div>
        <div class="match-card__team match-card__team--away ${winnerClass("away")}">
          <span class="match-card__tname">${esc(awayTeam.abbr)}</span>
          <span class="match-card__flag">${awayTeam.flag}</span>
        </div>
      </div>
    </div>
  `;
}

/* ── Event binding ───────────────────────────────────────────── */

function bindMatchCards(fixtures) {
  document.querySelectorAll(".match-card").forEach(card => {
    const handler = () => {
      document.querySelectorAll(".match-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");

      const id       = Number(card.dataset.id);
      const status   = card.dataset.status;
      const homeId   = Number(card.dataset.homeId);
      const awayId   = Number(card.dataset.awayId);
      const match    = fixtures.find(f => f.fixture.id === id);

      if (status === "FT") {
        loadMatchStats(id, match);
      } else {
        loadH2H(homeId, awayId, match);
      }
    };

    card.addEventListener("click", handler);
    card.addEventListener("keydown", e => e.key === "Enter" && handler());
  });
}

/* ── Painel: Estatísticas (partida finalizada) ───────────────── */

async function loadMatchStats(fixtureId, match) {
  const detail = document.getElementById("match-detail");
  showLoader(detail);

  try {
    const data = await fetchMatchStats(fixtureId);
    renderStatPanel(detail, match, data);
  } catch (err) {
    showError(detail, err.message ?? "Falha ao carregar as estatísticas.");
  }
}

function renderStatPanel(container, match, data) {
  const { fixture, teams, goals, league } = match;
  const homeTeam   = getTeam(teams.home.id);
  const awayTeam   = getTeam(teams.away.id);
  const statsHome  = indexStats(data.response?.[0]?.statistics ?? []);
  const statsAway  = indexStats(data.response?.[1]?.statistics ?? []);

  // Cores de contraste se forem idênticas ou padrão
  let clrHome = homeTeam.color;
  let clrAway = awayTeam.color;
  if (clrHome === clrAway || clrHome === "#D4AF37") {
    clrHome = "#22d3ee"; // Ciano vibrante para o mandante
    clrAway = "#fb7185"; // Coral sofisticado para o visitante
  }

  // Injeta cores dos times como variáveis CSS no painel
  const styleVars = `--clr-home:${clrHome};--clr-away:${clrAway};`;

  container.innerHTML = `
    <div class="detail-panel" style="${styleVars}">
      <!-- Cabeçalho do confronto -->
      <div class="detail-header">
        <div class="detail-header__eyebrow">
          <span class="badge badge--round">${esc(translateRound(league.round))}</span>
          <span class="detail-header__date">${fmtDate(fixture.date)}</span>
        </div>
        <div class="detail-header__scoreline">
          <div class="detail-team detail-team--home">
            <span class="detail-team__flag">${homeTeam.flag}</span>
            <span class="detail-team__name">${esc(homeTeam.name)}</span>
          </div>
          <div class="detail-score">
            <span class="detail-score__num ${teams.home.winner ? "winner" : ""}">${goals.home}</span>
            <span class="detail-score__sep">–</span>
            <span class="detail-score__num ${teams.away.winner ? "winner" : ""}">${goals.away}</span>
          </div>
          <div class="detail-team detail-team--away">
            <span class="detail-team__flag">${awayTeam.flag}</span>
            <span class="detail-team__name">${esc(awayTeam.name)}</span>
          </div>
        </div>
        <div class="detail-header__venue">🏟 ${esc(fixture.venue?.name ?? "")} · ${esc(fixture.venue?.city ?? "")}</div>
      </div>

      <!-- Legenda de cores -->
      <div class="stats-legend">
        <span class="stats-legend__item" style="color:var(--clr-home)">
          <span class="legend-dot" style="background:var(--clr-home)"></span>
          ${esc(homeTeam.name)}
        </span>
        <span class="stats-legend__label">Estatísticas</span>
        <span class="stats-legend__item stats-legend__item--right" style="color:var(--clr-away)">
          ${esc(awayTeam.name)}
          <span class="legend-dot" style="background:var(--clr-away)"></span>
        </span>
      </div>

      <!-- Barras de estatísticas -->
      <div class="stats-list">
        ${Object.entries(STAT_LABELS).map(([apiKey, meta]) =>
          renderStatBar(apiKey, meta, statsHome, statsAway)
        ).join("")}
      </div>
    </div>
  `;
}

function renderStatBar(apiKey, meta, statsHome, statsAway) {
  const rawH = statsHome[apiKey] ?? null;
  const rawA = statsAway[apiKey] ?? null;
  if (rawH === null && rawA === null) return "";

  const numH = parseStatVal(rawH);
  const numA = parseStatVal(rawA);

  let pctH = 0, pctA = 0;
  if (meta.isPercent) {
    pctH = numH;
    pctA = numA;
  } else {
    const maxVal = Math.max(numH, numA);
    pctH = maxVal > 0 ? (numH / maxVal) * 100 : 0;
    pctA = maxVal > 0 ? (numA / maxVal) * 100 : 0;
  }

  const dispH = `${numH}${meta.unit}`;
  const dispA = `${numA}${meta.unit}`;
  const domH  = numH > numA ? "dominant" : "";
  const domA  = numA > numH ? "dominant" : "";

  const icon = STAT_ICONS[meta.label] || "📊";

  return `
    <div class="stat-bar">
      <div class="stat-bar__values">
        <span class="stat-bar__val home ${domH}">${esc(dispH)}</span>
        <span class="stat-bar__label">${esc(meta.label)}</span>
        <span class="stat-bar__val away ${domA}">${esc(dispA)}</span>
      </div>
      <div class="stat-bar__track">
        <div class="stat-bar__fill home" style="width:${pctH}%"></div>
        <div class="stat-bar__divider">
          <span class="stat-bar__icon-badge">${icon}</span>
        </div>
        <div class="stat-bar__fill away" style="width:${pctA}%"></div>
      </div>
    </div>
  `;
}

/* ── Painel: Head-to-Head (partida futura) ───────────────────── */

async function loadH2H(homeId, awayId, match) {
  const detail = document.getElementById("match-detail");
  showLoader(detail);

  try {
    const [data, standingsData] = await Promise.all([
      fetchH2H(homeId, awayId),
      fetchStandings(),
    ]);
    renderH2H(detail, match, data, standingsData);
  } catch (err) {
    showError(detail, err.message ?? "Falha ao carregar o histórico.");
  }
}

function renderH2H(container, match, data, standingsData) {
  const { fixture, teams, league } = match;
  const homeTeam  = getTeam(teams.home.id);
  const awayTeam  = getTeam(teams.away.id);
  const h2hGames  = (data.response ?? []).slice(0, 10); // últimos 10

  // Cores de contraste se forem idênticas ou padrão
  let clrHome = homeTeam.color;
  let clrAway = awayTeam.color;
  if (clrHome === clrAway || clrHome === "#D4AF37") {
    clrHome = "#22d3ee"; // Ciano vibrante para o mandante
    clrAway = "#fb7185"; // Coral sofisticado para o visitante
  }

  // ── Mapeia Classificação para buscar as estatísticas das seleções
  const standings = standingsData?.response?.[0]?.league?.standings?.flat() ?? [];
  const standingMap = {};
  standings.forEach(entry => {
    standingMap[entry.team.id] = entry;
  });

  const homeStanding = standingMap[teams.home.id];
  const awayStanding = standingMap[teams.away.id];

  const getAvg = (standing, key) => {
    if (!standing) return 0;
    const played = standing.all?.played ?? 0;
    const val = standing[key];
    if (val == null) return 0;
    if (played <= 0) return 0;
    return val / played;
  };

  const homeCopaStats = {
    posse: homeStanding?.media_posse_bola ?? 0,
    golsFeitos: homeStanding?.all?.played > 0 ? (homeStanding.all.goals.for / homeStanding.all.played) : 0,
    golsSofridos: getAvg(homeStanding, "gols_sofridos"),
    chutes: getAvg(homeStanding, "total_chutes"),
    chutesNoAlvo: getAvg(homeStanding, "chutes_no_alvo"),
    chutesSofridos: getAvg(homeStanding, "chutes_sofridos"),
    chutesNoAlvoSofridos: getAvg(homeStanding, "chutes_no_alvo_sofridos"),
    corners: getAvg(homeStanding, "escanteios"),
    fouls: getAvg(homeStanding, "faltas_cometidas"),
    yellow: getAvg(homeStanding, "cartoes_amarelos"),
    red: getAvg(homeStanding, "cartoes_vermelhos"),
    laterais: getAvg(homeStanding, "laterais"),
    impedimentos: getAvg(homeStanding, "impedimentos"),
    passes: getAvg(homeStanding, "passes")
  };

  const awayCopaStats = {
    posse: awayStanding?.media_posse_bola ?? 0,
    golsFeitos: awayStanding?.all?.played > 0 ? (awayStanding.all.goals.for / awayStanding.all.played) : 0,
    golsSofridos: getAvg(awayStanding, "gols_sofridos"),
    chutes: getAvg(awayStanding, "total_chutes"),
    chutesNoAlvo: getAvg(awayStanding, "chutes_no_alvo"),
    chutesSofridos: getAvg(awayStanding, "chutes_sofridos"),
    chutesNoAlvoSofridos: getAvg(awayStanding, "chutes_no_alvo_sofridos"),
    corners: getAvg(awayStanding, "escanteios"),
    fouls: getAvg(awayStanding, "faltas_cometidas"),
    yellow: getAvg(awayStanding, "cartoes_amarelos"),
    red: getAvg(awayStanding, "cartoes_vermelhos"),
    laterais: getAvg(awayStanding, "laterais"),
    impedimentos: getAvg(awayStanding, "impedimentos"),
    passes: getAvg(awayStanding, "passes")
  };

  // ── Calcula estatísticas do H2H ────────────────────────────
  let winsHome = 0, winsAway = 0, draws = 0, goalsTotal = 0;

  h2hGames.forEach(game => {
    const gh = game.goals.home ?? 0;
    const ga = game.goals.away ?? 0;
    goalsTotal += gh + ga;

    if (game.teams.home.id === teams.home.id) {
      if (gh > ga) winsHome++; else if (gh < ga) winsAway++; else draws++;
    } else {
      if (ga > gh) winsHome++; else if (ga < gh) winsAway++; else draws++;
    }
  });

  const totalGames = h2hGames.length;
  const avgGoals   = totalGames ? (goalsTotal / totalGames).toFixed(1) : "–";

  container.innerHTML = `
    <div class="detail-panel detail-panel--h2h"
         style="--clr-home:${clrHome};--clr-away:${clrAway}">

      <!-- Cabeçalho: próxima partida -->
      <div class="detail-header">
        <div class="detail-header__eyebrow">
          <span class="badge badge--upcoming">📅 Próxima Partida</span>
          <span class="badge badge--round">${esc(translateRound(league.round))}</span>
          <span class="detail-header__date">${fmtDate(fixture.date)}</span>
        </div>
        <div class="detail-header__scoreline">
          <div class="detail-team detail-team--home">
            <span class="detail-team__flag">${homeTeam.flag}</span>
            <span class="detail-team__name">${esc(homeTeam.name)}</span>
          </div>
          <div class="detail-score detail-score--vs">
            <span class="vs-label">VS</span>
          </div>
          <div class="detail-team detail-team--away">
            <span class="detail-team__flag">${awayTeam.flag}</span>
            <span class="detail-team__name">${esc(awayTeam.name)}</span>
          </div>
        </div>
        <div class="detail-header__venue">🏟 ${esc(fixture.venue?.name ?? "")} · ${esc(fixture.venue?.city ?? "")}</div>
      </div>

      <!-- Comparativo Raio-X -->
      <div class="match-raiox" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
        <h3 class="raiox-title" style="font-size: 1.1rem; color: #f8fafc; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span>⚡</span> Raio-X do Confronto (Médias)
        </h3>

        <!-- Filtro de Escopo: Copa vs Ano 2026 -->
        <div class="profile-scope-filter">
          <button class="scope-btn active" id="h2h-scope-btn-copa">Só da Copa</button>
          <button class="scope-btn" id="h2h-scope-btn-ano">Ano 2026</button>
        </div>

        <div class="stats-legend" style="margin-top: 10px; margin-bottom: 8px;">
          <span class="stats-legend__item" style="color:var(--clr-home)">
            <span class="legend-dot" style="background:var(--clr-home)"></span>
            ${esc(homeTeam.name)}
          </span>
          <span class="stats-legend__label">Comparativo</span>
          <span class="stats-legend__item stats-legend__item--right" style="color:var(--clr-away)">
            ${esc(awayTeam.name)}
            <span class="legend-dot" style="background:var(--clr-away)"></span>
          </span>
        </div>
        <div class="stats-list" id="h2h-stats-list-container">
          <!-- Injetado dinamicamente -->
        </div>
      </div>

      <!-- Histórico de H2H -->
      <div class="h2h-summary-section" style="margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
        <h3 class="raiox-title" style="font-size: 1.1rem; color: #f8fafc; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span>📊</span> Retrospecto de Confrontos Diretos
        </h3>
        <div class="h2h-summary">
          <div class="h2h-stat h2h-stat--home">
            <span class="h2h-stat__num" style="color:var(--clr-home)">${winsHome}</span>
            <span class="h2h-stat__label">Vitórias<br>${esc(homeTeam.abbr)}</span>
          </div>
          <div class="h2h-stat h2h-stat--center">
            <span class="h2h-stat__num">${draws}</span>
            <span class="h2h-stat__label">Empates</span>
            <span class="h2h-stat__sub">Média: ${avgGoals} gols/jogo</span>
          </div>
          <div class="h2h-stat h2h-stat--away">
            <span class="h2h-stat__num" style="color:var(--clr-away)">${winsAway}</span>
            <span class="h2h-stat__label">Vitórias<br>${esc(awayTeam.abbr)}</span>
          </div>
        </div>

      <!-- Barra visual do H2H -->
      ${totalGames > 0 ? renderH2HBar(winsHome, draws, winsAway) : ""}

      <!-- Histórico de jogos -->
      <div class="h2h-history">
        <h3 class="h2h-history__title">
          Últimos confrontos (${totalGames})
        </h3>
        ${totalGames === 0
          ? '<p class="h2h-history__empty">Sem histórico de confrontos diretos.</p>'
          : h2hGames.map(g => renderH2HGame(g, teams.home.id, homeTeam, awayTeam)).join("")
        }
      </div>
    </div>
  `;

  const btnCopa = document.getElementById("h2h-scope-btn-copa");
  const btnAno  = document.getElementById("h2h-scope-btn-ano");
  const statsContainer = document.getElementById("h2h-stats-list-container");

  const showCopaContent = () => {
    statsContainer.innerHTML = renderH2HStatsListHtml(homeCopaStats, awayCopaStats);
  };

  const showAnoContent = async () => {
    showLoader(statsContainer);
    try {
      const [dataH, dataA] = await Promise.all([
        fetchTeamStats2026(teams.home.id),
        fetchTeamStats2026(teams.away.id)
      ]);
      
      const statsH = dataH.estatisticas || {};
      const statsA = dataA.estatisticas || {};
      
      const homeAnoStats = {
        posse: statsH.media_posse_bola ?? 50,
        golsFeitos: statsH.gols_feitos ?? 0,
        golsSofridos: statsH.gols_sofridos ?? 0,
        chutes: statsH.total_chutes ?? 0,
        chutesNoAlvo: statsH.chutes_no_alvo ?? 0,
        chutesSofridos: statsH.chutes_sofridos ?? 0,
        chutesNoAlvoSofridos: statsH.chutes_no_alvo_sofridos ?? 0,
        corners: statsH.escanteios ?? 0,
        fouls: statsH.faltas_cometidas ?? 0,
        yellow: statsH.cartoes_amarelos ?? 0,
        red: statsH.cartoes_vermelhos ?? 0,
        laterais: statsH.laterais ?? 0,
        impedimentos: statsH.impedimentos ?? 0,
        passes: statsH.passes ?? 0
      };

      const awayAnoStats = {
        posse: statsA.media_posse_bola ?? 50,
        golsFeitos: statsA.gols_feitos ?? 0,
        golsSofridos: statsA.gols_sofridos ?? 0,
        chutes: statsA.total_chutes ?? 0,
        chutesNoAlvo: statsA.chutes_no_alvo ?? 0,
        chutesSofridos: statsA.chutes_sofridos ?? 0,
        chutesNoAlvoSofridos: statsA.chutes_no_alvo_sofridos ?? 0,
        corners: statsA.escanteios ?? 0,
        fouls: statsA.faltas_cometidas ?? 0,
        yellow: statsA.cartoes_amarelos ?? 0,
        red: statsA.cartoes_vermelhos ?? 0,
        laterais: statsA.laterais ?? 0,
        impedimentos: statsA.impedimentos ?? 0,
        passes: statsA.passes ?? 0
      };
      
      statsContainer.innerHTML = renderH2HStatsListHtml(homeAnoStats, awayAnoStats);
    } catch (err) {
      showError(statsContainer, err.message ?? "Erro ao carregar dados do ano.");
    }
  };

  btnCopa.addEventListener("click", () => {
    if (btnCopa.classList.contains("active")) return;
    btnCopa.classList.add("active");
    btnAno.classList.remove("active");
    showCopaContent();
  });

  btnAno.addEventListener("click", () => {
    if (btnAno.classList.contains("active")) return;
    btnAno.classList.add("active");
    btnCopa.classList.remove("active");
    showAnoContent();
  });

  showCopaContent();
}

function renderH2HStatsListHtml(statsH, statsA) {
  return `
    ${renderComparisonBar("Posse de Bola", statsH.posse, statsA.posse, "%", true, 0)}
    ${renderComparisonBar("Passes por Jogo", statsH.passes, statsA.passes, "", false, 0)}
    ${renderComparisonBar("Gols Feitos por Jogo", statsH.golsFeitos, statsA.golsFeitos, "", false, 1)}
    ${renderComparisonBar("Gols Sofridos por Jogo", statsH.golsSofridos, statsA.golsSofridos, "", false, 1, true)}
    ${renderComparisonBar("Chutes por Jogo", statsH.chutes, statsA.chutes, "", false, 1)}
    ${renderComparisonBar("Chutes no Alvo por Jogo", statsH.chutesNoAlvo, statsA.chutesNoAlvo, "", false, 1)}
    ${renderComparisonBar("Chutes Sofridos por Jogo", statsH.chutesSofridos, statsA.chutesSofridos, "", false, 1, true)}
    ${renderComparisonBar("Chutes no Alvo Sofridos por Jogo", statsH.chutesNoAlvoSofridos, statsA.chutesNoAlvoSofridos, "", false, 1, true)}
    ${renderComparisonBar("Escanteios por Jogo", statsH.corners, statsA.corners, "", false, 1)}
    ${renderComparisonBar("Faltas por Jogo", statsH.fouls, statsA.fouls, "", false, 1)}
    ${renderComparisonBar("Cartões Amarelos por Jogo", statsH.yellow, statsA.yellow, "", false, 1)}
    ${renderComparisonBar("Cartões Vermelhos por Jogo", statsH.red, statsA.red, "", false, 1)}
    ${renderComparisonBar("Impedimentos por Jogo", statsH.impedimentos, statsA.impedimentos, "", false, 1)}
    ${renderComparisonBar("Laterais por Jogo", statsH.laterais, statsA.laterais, "", false, 0)}
  `;
}

function renderH2HBar(winsHome, draws, winsAway) {
  const total = winsHome + draws + winsAway;
  if (!total) return "";
  const pctH = Math.round((winsHome / total) * 100);
  const pctD = Math.round((draws    / total) * 100);
  const pctA = 100 - pctH - pctD;

  return `
    <div class="h2h-bar">
      <div class="h2h-bar__segment h2h-bar__segment--home" style="width:${pctH}%" title="${winsHome} vitórias"></div>
      <div class="h2h-bar__segment h2h-bar__segment--draw" style="width:${pctD}%" title="${draws} empates"></div>
      <div class="h2h-bar__segment h2h-bar__segment--away" style="width:${pctA}%" title="${winsAway} vitórias"></div>
    </div>
  `;
}

function renderH2HGame(game, homeIdCurrent, homeTeam, awayTeam) {
  const gh   = game.goals.home ?? 0;
  const ga   = game.goals.away ?? 0;
  const date = fmtDateShort(game.fixture.date);
  const isCurrentHome = game.teams.home.id === homeIdCurrent;

  // Resultado do ponto de vista do time da casa do confronto atual
  let resultForHome;
  if (isCurrentHome) {
    resultForHome = gh > ga ? "W" : gh < ga ? "L" : "D";
  } else {
    resultForHome = ga > gh ? "W" : ga < gh ? "L" : "D";
  }

  const resultClass = { W: "result--win", L: "result--loss", D: "result--draw" }[resultForHome];
  const resultLabel = { W: "V", L: "D", D: "E" }[resultForHome];

  // Penalty shootout
  const pen = game.score?.penalty;
  const penStr = pen?.home != null ? ` (pen. ${pen.home}–${pen.away})` : "";

  const homeName = isCurrentHome ? homeTeam.flag : awayTeam.flag;
  const awayName = isCurrentHome ? awayTeam.flag : homeTeam.flag;

  return `
    <div class="h2h-game">
      <span class="h2h-game__date">${date}</span>
      <div class="h2h-game__result">
        <span class="h2h-game__team">${homeName} ${esc(game.teams.home.name)}</span>
        <span class="h2h-game__score">${gh} – ${ga}${esc(penStr)}</span>
        <span class="h2h-game__team h2h-game__team--away">${esc(game.teams.away.name)} ${awayName}</span>
      </div>
      <span class="h2h-game__badge ${resultClass}">${resultLabel}</span>
    </div>
  `;
}

/* ── Helpers ─────────────────────────────────────────────────── */

/** Transforma array de statistics em objeto {type: value} */
function indexStats(arr) {
  return Object.fromEntries(arr.map(s => [s.type, s.value]));
}

function renderComparisonBar(label, valH, valA, unit = "", isPercent = false, decimals = 1, smallerIsDominant = false) {
  const numH = Number(valH ?? 0);
  const numA = Number(valA ?? 0);
  const total = numH + numA;

  let pctH = 0, pctA = 0;
  if (isPercent) {
    pctH = numH;
    pctA = numA;
  } else {
    const maxVal = Math.max(numH, numA);
    pctH = maxVal > 0 ? (numH / maxVal) * 100 : 0;
    pctA = maxVal > 0 ? (numA / maxVal) * 100 : 0;
  }

  const dispH = `${numH.toFixed(decimals)}${unit}`;
  const dispA = `${numA.toFixed(decimals)}${unit}`;
  
  let domH = "";
  let domA = "";
  if (numH !== numA) {
  if (smallerIsDominant) {
      domH = numH < numA ? "dominant" : "";
      domA = numA < numH ? "dominant" : "";
    } else {
      domH = numH > numA ? "dominant" : "";
      domA = numA > numH ? "dominant" : "";
    }
  }

  const icon = STAT_ICONS[label] || "📊";

  return `
    <div class="stat-bar">
      <div class="stat-bar__values">
        <span class="stat-bar__val home ${domH}">${esc(dispH)}</span>
        <span class="stat-bar__label">${esc(label)}</span>
        <span class="stat-bar__val away ${domA}">${esc(dispA)}</span>
      </div>
      <div class="stat-bar__track">
        <div class="stat-bar__fill home" style="width:${pctH}%"></div>
        <div class="stat-bar__divider">
          <span class="stat-bar__icon-badge">${icon}</span>
        </div>
        <div class="stat-bar__fill away" style="width:${pctA}%"></div>
      </div>
    </div>
  `;
}
