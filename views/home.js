/**
 * views/home.js — Aba "Resumo"
 * ─────────────────────────────────────────────────────────────
 * Exibe:
 *   • Hero: último jogo / jogo em andamento com placar destacado
 *   • Cards de resumo do torneio (total de gols, artilheiro, etc.)
 *   • Ranking dos 5 maiores artilheiros
 */

import { fetchFixtures, fetchTopScorers } from "../api.js";
import { getTeam, showLoader, showError, esc, fmtDate, translateRound } from "../utils.js";

export async function renderHome(container) {
  showLoader(container);

  try {
    const [fixturesData, scorersData] = await Promise.all([
      fetchFixtures(),
      fetchTopScorers(),
    ]);

    const fixtures  = fixturesData.response  ?? [];
    const scorers   = scorersData.response   ?? [];

    // ── Análise dos dados ────────────────────────────────────
    const finished  = fixtures.filter(f => f.fixture.status.short === "FT");
    const upcoming  = fixtures.filter(f => f.fixture.status.short === "NS");
    const live      = fixtures.filter(f => !["FT","NS","PST"].includes(f.fixture.status.short));

    // Jogo hero: ao vivo > último finalizado > próximo futuro
    const heroMatch = live[0]
      ?? [...finished].sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date))[0]
      ?? upcoming[0];

    // Estatísticas gerais
    const totalGoals  = finished.reduce((acc, f) => acc + (f.goals.home ?? 0) + (f.goals.away ?? 0), 0);
    const avgGoals    = finished.length ? (totalGoals / finished.length).toFixed(2) : "–";
    const topScorer   = scorers[0];
    const topScorers5 = scorers.slice(0, 5);

    // ── Render ───────────────────────────────────────────────
    container.innerHTML = `
      <div class="view-home">

        ${heroMatch ? renderHero(heroMatch, live.length > 0) : renderNoMatch()}

        <!-- Cards de estatísticas gerais -->
        <section class="summary-cards" aria-label="Resumo do torneio">
          ${summaryCard("⚽", "Gols marcados",   totalGoals)}
          ${summaryCard("🏟️", "Jogos realizados", finished.length)}
          ${summaryCard("📅", "Jogos restantes",  upcoming.length)}
          ${summaryCard("📊", "Média de gols",    avgGoals)}
        </section>

        <!-- Artilheiros -->
        <section class="scorers-section">
          <h2 class="section-title">
            <span class="section-title__icon">🥇</span> Artilheiros
          </h2>
          <div class="scorers-list">
            ${topScorers5.map((s, i) => renderScorerRow(s, i + 1)).join("")}
          </div>
        </section>

      </div>
    `;
  } catch (err) {
    showError(container, err.message ?? "Falha ao carregar o resumo.");
  }
}

/* ── Sub-renders ─────────────────────────────────────────────── */

function renderHero(match, isLive) {
  const { fixture, teams, goals, league } = match;
  const homeTeam = getTeam(teams.home.id);
  const awayTeam = getTeam(teams.away.id);
  const isFinished = fixture.status.short === "FT";

  const scoreHome = goals.home ?? "–";
  const scoreAway = goals.away ?? "–";
  const winClass  = (team) =>
    isFinished
      ? (teams[team].winner === true ? "winner" : teams[team].winner === false ? "loser" : "")
      : "";

  return `
    <section class="hero-match" aria-label="Jogo em destaque">
      <div class="hero-match__eyebrow">
        ${isLive ? '<span class="badge badge--live">🔴 Ao Vivo</span>' : ""}
        <span class="badge badge--round">${esc(translateRound(league.round))}</span>
        <span class="hero-match__date">${fmtDate(fixture.date)}</span>
      </div>

      <div class="hero-match__pitch">
        <!-- Time da Casa -->
        <div class="hero-team hero-team--home ${winClass("home")}">
          <span class="hero-team__flag">${homeTeam.flag}</span>
          <span class="hero-team__name">${esc(homeTeam.name)}</span>
          <span class="hero-team__abbr">${esc(homeTeam.abbr)}</span>
        </div>

        <!-- Placar central -->
        <div class="hero-score">
          <div class="hero-score__board">
            <span class="hero-score__num ${winClass("home")}">${scoreHome}</span>
            <span class="hero-score__sep">–</span>
            <span class="hero-score__num ${winClass("away")}">${scoreAway}</span>
          </div>
          <div class="hero-score__status">${fixture.status.long}</div>
          <div class="hero-score__venue">🏟 ${esc(fixture.venue?.name ?? "")}</div>
        </div>

        <!-- Time Visitante -->
        <div class="hero-team hero-team--away ${winClass("away")}">
          <span class="hero-team__flag">${awayTeam.flag}</span>
          <span class="hero-team__name">${esc(awayTeam.name)}</span>
          <span class="hero-team__abbr">${esc(awayTeam.abbr)}</span>
        </div>
      </div>
    </section>
  `;
}

function renderNoMatch() {
  return `
    <section class="hero-match hero-match--empty">
      <p>Nenhuma partida encontrada.</p>
    </section>
  `;
}

function summaryCard(icon, label, value) {
  return `
    <div class="summary-card">
      <span class="summary-card__icon">${icon}</span>
      <span class="summary-card__value">${esc(String(value))}</span>
      <span class="summary-card__label">${esc(label)}</span>
    </div>
  `;
}

function renderScorerRow(entry, rank) {
  const player = entry.player;
  const stat   = entry.statistics[0];
  const goals  = stat?.goals?.total ?? 0;
  const teamMeta = getTeam(stat?.team);

  const rankClass = rank === 1 ? "rank--gold" : rank === 2 ? "rank--silver" : rank === 3 ? "rank--bronze" : "";

  return `
    <div class="scorer-row">
      <span class="scorer-rank ${rankClass}">${rank}</span>
      <div class="scorer-info">
        <span class="scorer-name">${esc(player.name)}</span>
        <span class="scorer-team">${teamMeta.flag} ${esc(teamMeta.name)}</span>
      </div>
      <span class="scorer-goals">
        <span class="scorer-goals__num">${goals}</span>
        <span class="scorer-goals__label">gols</span>
      </span>
    </div>
  `;
}
