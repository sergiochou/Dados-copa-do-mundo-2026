/**
 * views/teams.js — Aba "Seleções"
 * ─────────────────────────────────────────────────────────────
 * Grade com todas as seleções participantes.
 * Ao clicar em um card, exibe um painel lateral com
 * os dados dessa seleção extraídos da classificação.
 */

import { fetchStandings, fetchFixtures, fetchTeamStats2026 } from "../api.js";
import { getTeam, showLoader, showError, esc } from "../utils.js";
import { TEAMS } from "../utils.js";

export async function renderTeams(container) {
  showLoader(container);

  try {
    const [standingsData, fixturesData] = await Promise.all([
      fetchStandings(),
      fetchFixtures(),
    ]);

    const standings = standingsData.response?.[0]?.league?.standings?.flat() ?? [];
    const fixtures  = fixturesData.response ?? [];

    // Monta mapa de id → dados de classificação
    const standingMap = {};
    standings.forEach(entry => {
      // Evita que o grupo "THIRD-PLACED TEAMS" (ou similar) sobrescreva o grupo real do time (A, B, C, etc.)
      const isThirdPlaced = String(entry.group).toUpperCase().includes("THIRD");
      if (!standingMap[entry.team.id] || !isThirdPlaced) {
        standingMap[entry.team.id] = entry;
      }
    });

    // Extrai todos os times únicos das fixtures (fallback se standings vazio)
    const teamsFromFixtures = new Map();
    fixtures.forEach(f => {
      [f.teams.home, f.teams.away].forEach(t => {
        if (!teamsFromFixtures.has(t.id)) teamsFromFixtures.set(t.id, t);
      });
    });

    // Une as duas fontes - Se standings estiver preenchido, usamos apenas os times reais dele.
    // Se standings estiver vazio, usamos os times das fixtures excluindo placeholders conhecidos.
    let allTeamIds;
    if (standings.length > 0) {
      allTeamIds = new Set(standings.map(e => e.team.id));
    } else {
      allTeamIds = new Set(
        [...teamsFromFixtures.keys()].filter(id => {
          const t = teamsFromFixtures.get(id);
          const name = t.name || "";
          const code = t.code || t.sigla || "";
          // Ignora placeholders como "1B", "2E", "G1", "3A/3B/3C/3D/3F"
          const isPlaceholder = /^[1-4][A-L](?:\/[1-4][A-L])*$/.test(name) ||
                                /^G\d+$/.test(name) ||
                                /^\d+[A-Z\d\/]+$/.test(name) ||
                                !code ||
                                code.length > 4;
          return !isPlaceholder;
        })
      );
    }

    // Ordena as seleções alfabeticamente pelo nome traduzido
    const sortedTeamIds = [...allTeamIds].sort((a, b) => {
      const nameA = getTeam(a).name || "";
      const nameB = getTeam(b).name || "";
      return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
    });

    container.innerHTML = `
      <div class="view-teams">
        <!-- Grade de seleções -->
        <div class="teams-grid" id="teams-grid">
          ${sortedTeamIds.map(id => renderTeamCard(id, standingMap[id])).join("")}
        </div>

        <!-- Painel de detalhes (oculto até seleção) -->
        <aside class="team-detail" id="team-detail">
          <div class="team-detail__empty">
            <span>👆</span>
            <p>Selecione uma seleção para ver detalhes.</p>
          </div>
        </aside>
      </div>
    `;

    bindTeamCards(standingMap, fixtures);

  } catch (err) {
    showError(container, err.message ?? "Falha ao carregar as seleções.");
  }
}

/* ── Card de seleção ─────────────────────────────────────────── */

function renderTeamCard(teamId, standingEntry) {
  const meta   = getTeam(teamId);
  const pts    = standingEntry?.points    ?? "–";
  const played = standingEntry?.all?.played ?? "–";
  const group  = standingEntry?.group     ?? "";

  return `
    <div
      class="team-card"
      data-id="${teamId}"
      role="button"
      tabindex="0"
      aria-label="${esc(meta.name)}"
      style="--tc-color:${meta.color};--tc-bg:${meta.bg}"
    >
      <div class="team-card__glow"></div>
      <span class="team-card__flag">${meta.flag}</span>
      <span class="team-card__name">${esc(meta.name)}</span>
      <span class="team-card__abbr">${esc(meta.abbr)}</span>
      ${group ? `<span class="team-card__group">${esc(group)}</span>` : ""}
      <div class="team-card__stats">
        <span><strong>${pts}</strong><br>pts</span>
        <span><strong>${played}</strong><br>jogos</span>
      </div>
    </div>
  `;
}

/* ── Binding e painel de detalhes ────────────────────────────── */

function bindTeamCards(standingMap, fixtures) {
  document.querySelectorAll(".team-card").forEach(card => {
    const handler = () => {
      document.querySelectorAll(".team-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");

      const teamId = Number(card.dataset.id);
      renderTeamDetail(teamId, standingMap[teamId], fixtures);
    };

    card.addEventListener("click", handler);
    card.addEventListener("keydown", e => e.key === "Enter" && handler());
  });
}

function renderTeamDetail(teamId, standingEntry, fixtures) {
  const panel = document.getElementById("team-detail");
  const meta  = getTeam(teamId);

  // Jogos desse time
  const teamFixtures = fixtures.filter(
    f => f.teams.home.id === teamId || f.teams.away.id === teamId
  );

  const finished = teamFixtures.filter(f => f.fixture.status.short === "FT");
  const upcoming = teamFixtures.filter(f => f.fixture.status.short === "NS");

  // Stats oficiais obtidas da classificação, ou calculadas dos jogos como fallback
  let calcWins = 0, calcDraws = 0, calcLosses = 0, calcGoalsFor = 0, calcGoalsAgainst = 0;
  finished.forEach(f => {
    const isHome = f.teams.home.id === teamId;
    const gf = isHome ? (f.goals.home ?? 0) : (f.goals.away ?? 0);
    const ga = isHome ? (f.goals.away ?? 0) : (f.goals.home ?? 0);
    calcGoalsFor += gf; calcGoalsAgainst += ga;
    const winner = isHome ? f.teams.home.winner : f.teams.away.winner;
    if (winner === true) calcWins++;
    else if (winner === false) calcLosses++;
    else calcDraws++;
  });

  const played = standingEntry?.all?.played ?? finished.length ?? 0;
  const wins = standingEntry?.all?.win ?? calcWins;
  const draws = standingEntry?.all?.draw ?? calcDraws;
  const losses = standingEntry?.all?.lose ?? calcLosses;
  const goalsFor = standingEntry?.all?.goals?.for ?? calcGoalsFor;
  const goalsAgainst = standingEntry?.all?.goals?.against ?? calcGoalsAgainst;
  const pts   = standingEntry?.points ?? wins * 3 + draws;
  const group = standingEntry?.group  ?? "–";
  const rank  = standingEntry?.rank   ?? "–";
  const form  = standingEntry?.form   ?? "";
  const getAverage = (val) => {
    if (val == null) return null;
    if (played <= 0) return 0;
    return val / played;
  };
  const avgGoalsFor = played > 0 ? (goalsFor / played).toFixed(2) : "0.00";
  const avgGoalsAgainst = played > 0 ? (goalsAgainst / played).toFixed(2) : "0.00";

  panel.innerHTML = `
    <div class="team-profile" style="--tc-color:${meta.color};--tc-bg:${meta.bg}">
      <div class="team-profile__header">
        <span class="team-profile__flag">${meta.flag}</span>
        <div>
          <h2 class="team-profile__name">${esc(meta.name)}</h2>
          <p class="team-profile__group">${esc(group)} · ${rank}º lugar</p>
        </div>
      </div>

      <!-- Filtro de Escopo: Copa vs Ano 2026 -->
      <div class="profile-scope-filter">
        <button class="scope-btn active" id="scope-btn-copa">Só da Copa</button>
        <button class="scope-btn" id="scope-btn-ano">Ano 2026</button>
      </div>

      <!-- Container de Conteúdo Dinâmico -->
      <div id="profile-dynamic-content">
        <!-- Injetado dinamicamente -->
      </div>
    </div>
  `;

  const dynContent = document.getElementById("profile-dynamic-content");

  const showCopaContent = () => {
    dynContent.innerHTML = `
      <!-- Forma recente -->
      ${form ? `
      <div class="team-profile__form">
        <span class="profile-section-label">Forma Recente</span>
        <div class="form-strip">
          ${form.split("").map(f => {
            const cls = f === "W" ? "form--w" : f === "D" ? "form--d" : "form--l";
            const lbl = f === "W" ? "V" : f === "D" ? "E" : "D";
            return `<span class="form-dot ${cls}">${lbl}</span>`;
          }).join("")}
        </div>
      </div>` : ""}

      <!-- Estatísticas na Copa -->
      <div class="team-profile__stats-grid">
        ${profileStat("Pontos",     pts)}
        ${profileStat("Vitórias",   wins)}
        ${profileStat("Empates",    draws)}
        ${profileStat("Derrotas",   losses)}
        ${profileStat("Gols Pró",   goalsFor)}
        ${profileStat("Gols Contra",goalsAgainst)}
        ${profileStat("Gols Pró/Jogo", avgGoalsFor)}
        ${profileStat("Gols Contra/Jogo", avgGoalsAgainst)}
      </div>

      <!-- Estatísticas do Torneio -->
      <div class="team-profile__deep-stats">
        <span class="profile-section-label">Estatísticas na Copa (Média por Jogo)</span>
        <div class="deep-stats-list">
          ${renderDeepStatRow("Posse de Bola", standingEntry?.media_posse_bola, "%")}
          ${renderDeepStatRow("Passes por Jogo", getAverage(standingEntry?.passes), "", 0)}
          ${renderDeepStatRow("Gols Feitos por Jogo", avgGoalsFor, "", 1)}
          ${renderDeepStatRow("Gols Sofridos por Jogo", getAverage(standingEntry?.gols_sofridos), "", 1)}
          ${renderDeepStatRow("Chutes por Jogo", getAverage(standingEntry?.total_chutes), "", 1)}
          ${renderDeepStatRow("Chutes no Alvo por Jogo", getAverage(standingEntry?.chutes_no_alvo), "", 1)}
          ${renderDeepStatRow("Chutes Sofridos por Jogo", getAverage(standingEntry?.chutes_sofridos), "", 1)}
          ${renderDeepStatRow("Chutes no Alvo Sofridos por Jogo", getAverage(standingEntry?.chutes_no_alvo_sofridos), "", 1)}
          ${renderDeepStatRow("Escanteios por Jogo", getAverage(standingEntry?.escanteios), "", 1)}
          ${renderDeepStatRow("Faltas Cometidas por Jogo", getAverage(standingEntry?.faltas_cometidas), "", 1)}
          ${renderDeepStatRow("Impedimentos por Jogo", getAverage(standingEntry?.impedimentos), "", 1)}
          ${renderDeepStatRow("Laterais por Jogo", getAverage(standingEntry?.laterais), "", 0)}
          
          <div class="deep-stat-row">
            <span class="deep-stat-label">Cartões Amarelos por Jogo</span>
            <span class="deep-stat-value">
              <span class="card-rect yellow" style="width: 9px; height: 13px; border-radius: 2px; display: inline-block; margin-right: 6px; background-color: #FBBF24; vertical-align: middle;"></span>
              ${standingEntry?.cartoes_amarelos != null ? (played > 0 ? (standingEntry.cartoes_amarelos / played).toFixed(1) : "0.0") : "–"}
            </span>
          </div>
          
          <div class="deep-stat-row">
            <span class="deep-stat-label">Cartões Vermelhos por Jogo</span>
            <span class="deep-stat-value">
              <span class="card-rect red" style="width: 9px; height: 13px; border-radius: 2px; display: inline-block; margin-right: 6px; background-color: #EF4444; vertical-align: middle;"></span>
              ${standingEntry?.cartoes_vermelhos != null ? (played > 0 ? (standingEntry.cartoes_vermelhos / played).toFixed(1) : "0.0") : "–"}
            </span>
          </div>
        </div>
      </div>

      <!-- Próximos jogos desse time -->
      ${upcoming.length ? `
      <div class="team-profile__upcoming">
        <span class="profile-section-label">Próximas Partidas na Copa</span>
        ${upcoming.slice(0, 3).map(f => {
          const isHome = f.teams.home.id === teamId;
          const opp    = getTeam(isHome ? f.teams.away.id : f.teams.home.id);
          const date   = new Date(f.fixture.date).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "short", timeZone: "America/Sao_Paulo",
          });
          return `
            <div class="upcoming-fixture">
              <span class="upcoming-fixture__date">${date}</span>
              <span class="upcoming-fixture__teams">
                ${isHome ? `${meta.flag} ${esc(meta.abbr)} vs ${esc(opp.abbr)} ${opp.flag}`
                         : `${opp.flag} ${esc(opp.abbr)} vs ${esc(meta.abbr)} ${meta.flag}`}
              </span>
              <span class="upcoming-fixture__round">${esc(standingEntry?.group ?? f.league?.round ?? "")}</span>
            </div>
          `;
        }).join("")}
      </div>` : ""}
    `;
  };

  const showAnoContent = async () => {
    showLoader(dynContent);
    try {
      const data2026 = await fetchTeamStats2026(meta.id || teamId);
      const stats = data2026.estatisticas || {};
      const jogos = data2026.jogos || [];
      const jJogados = stats.jogos_jogados ?? 0;
      
      dynContent.innerHTML = `
        <!-- Estatísticas do Ano -->
        <div class="team-profile__deep-stats" style="margin-top: 0;">
          <span class="profile-section-label">Estatísticas Acumuladas 2026 (Média por Jogo)</span>
          <div class="deep-stats-list">
            ${renderDeepStatRow("Jogos Disputados no Ano", jJogados, "", 0)}
            ${renderDeepStatRow("Posse de Bola", stats.media_posse_bola, "%")}
            ${renderDeepStatRow("Passes por Jogo", stats.passes, "", 0)}
            ${renderDeepStatRow("Gols Feitos por Jogo", stats.gols_feitos, "", 1)}
            ${renderDeepStatRow("Gols Sofridos por Jogo", stats.gols_sofridos, "", 1)}
            ${renderDeepStatRow("Chutes por Jogo", stats.total_chutes, "", 1)}
            ${renderDeepStatRow("Chutes no Alvo por Jogo", stats.chutes_no_alvo, "", 1)}
            ${renderDeepStatRow("Chutes Sofridos por Jogo", stats.chutes_sofridos, "", 1)}
            ${renderDeepStatRow("Chutes no Alvo Sofridos por Jogo", stats.chutes_no_alvo_sofridos, "", 1)}
            ${renderDeepStatRow("Escanteios por Jogo", stats.escanteios, "", 1)}
            ${renderDeepStatRow("Faltas Cometidas por Jogo", stats.faltas_cometidas, "", 1)}
            ${renderDeepStatRow("Impedimentos por Jogo", stats.impedimentos, "", 1)}
            ${renderDeepStatRow("Laterais por Jogo", stats.laterais, "", 0)}
            
            <div class="deep-stat-row">
              <span class="deep-stat-label">Cartões Amarelos por Jogo</span>
              <span class="deep-stat-value">
                <span class="card-rect yellow" style="width: 9px; height: 13px; border-radius: 2px; display: inline-block; margin-right: 6px; background-color: #FBBF24; vertical-align: middle;"></span>
                ${stats.cartoes_amarelos != null ? stats.cartoes_amarelos.toFixed(1) : "0.0"}
              </span>
            </div>
            
            <div class="deep-stat-row">
              <span class="deep-stat-label">Cartões Vermelhos por Jogo</span>
              <span class="deep-stat-value">
                <span class="card-rect red" style="width: 9px; height: 13px; border-radius: 2px; display: inline-block; margin-right: 6px; background-color: #EF4444; vertical-align: middle;"></span>
                ${stats.cartoes_vermelhos != null ? stats.cartoes_vermelhos.toFixed(1) : "0.0"}
              </span>
            </div>
          </div>
        </div>

        <!-- Últimos jogos de 2026 -->
        <div class="team-profile__upcoming">
          <span class="profile-section-label">Últimos Jogos em 2026 (${jogos.length})</span>
          ${jogos.length ? jogos.map(j => {
            const mFlag = getTeam(j.mandante).flag;
            const vFlag = getTeam(j.visitante).flag;
            
            let dateStr = "";
            if (j.data && j.data !== "N/A") {
              dateStr = new Date(j.data).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "short", timeZone: "America/Sao_Paulo",
              });
            }
            
            const placarStr = j.status === "Encerrado" 
              ? `<strong>${j.mandante.placar} – ${j.visitante.placar}</strong>`
              : `<span class="vs-label">VS</span>`;
              
            return `
              <div class="upcoming-fixture" style="padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; border-radius: 6px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); margin-bottom: 8px;">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span class="upcoming-fixture__date" style="font-size: 0.75rem; color: var(--text-secondary);">${dateStr}</span>
                  <span style="font-size: 0.7rem; color: var(--gold); text-transform: uppercase; font-weight: 500;">${esc(j.torneio)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-primary);">
                  <span>${mFlag} ${esc(j.mandante.sigla)}</span>
                  <span>${placarStr}</span>
                  <span>${esc(j.visitante.sigla)} ${vFlag}</span>
                </div>
              </div>
            `;
          }).join("") : '<p style="color: var(--text-secondary); font-size: 0.8rem; text-align: center; padding: 10px;">Nenhum jogo encontrado em 2026.</p>'}
        </div>
      `;
    } catch (err) {
      showError(dynContent, err.message ?? "Falha ao carregar estatísticas do ano.");
    }
  };

  const btnCopa = document.getElementById("scope-btn-copa");
  const btnAno  = document.getElementById("scope-btn-ano");

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

function profileStat(label, value) {
  return `
    <div class="profile-stat">
      <span class="profile-stat__val">${value}</span>
      <span class="profile-stat__label">${esc(label)}</span>
    </div>
  `;
}

function renderDeepStatRow(label, value, unit = "", decimals = 1) {
  const finalDecimals = label.toLowerCase().includes("posse") ? 0 : decimals;
  const dispValue = value != null ? `${Number(value).toFixed(finalDecimals)}${unit}` : "–";
  return `
    <div class="deep-stat-row">
      <span class="deep-stat-label">${esc(label)}</span>
      <span class="deep-stat-value">${dispValue}</span>
    </div>
  `;
}
