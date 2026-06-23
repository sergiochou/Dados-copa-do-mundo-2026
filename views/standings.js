/**
 * views/standings.js — Aba "Grupos"
 * ─────────────────────────────────────────────────────────────
 * Renderiza a tabela de classificação de todos os grupos
 * do torneio em um grid responsivo.
 */

import { fetchStandings } from "../api.js";
import { getTeam, showLoader, showError, esc } from "../utils.js";

export async function renderStandings(container) {
  showLoader(container);

  try {
    const data   = await fetchStandings();
    const league = data.response?.[0]?.league;

    if (!league?.standings?.length) {
      showError(container, "Classificação ainda não disponível.");
      return;
    }

    const groups = league.standings;

    container.innerHTML = `
      <div class="view-standings">
        <header class="view-header">
          <h1 class="view-title">Fase de Grupos</h1>
          <p class="view-subtitle">${groups.length} grupos · ${groups.flat().length} seleções</p>
        </header>
        <div class="groups-grid">
          ${groups.map(group => renderGroup(group)).join("")}
        </div>
      </div>
    `;
  } catch (err) {
    showError(container, err.message ?? "Falha ao carregar a classificação.");
  }
}

/* ── Sub-renders ─────────────────────────────────────────────── */

function renderGroup(entries) {
  if (!entries?.length) return "";
  const groupName = entries[0].group ?? "Grupo";

  return `
    <div class="group-card">
      <div class="group-card__header">
        <span class="group-card__name">${esc(groupName)}</span>
      </div>
      <table class="standings-table" aria-label="Classificação ${esc(groupName)}">
        <thead>
          <tr>
            <th class="col-rank">#</th>
            <th class="col-team">Seleção</th>
            <th class="col-pts">Pts</th>
            <th class="col-stat" title="Partidas Jogadas">PJ</th>
            <th class="col-stat" title="Vitórias">VIT</th>
            <th class="col-stat" title="Empates">E</th>
            <th class="col-stat" title="Derrotas">DER</th>
            <th class="col-stat" title="Gols Marcados">GM</th>
            <th class="col-stat" title="Gols Contra">GC</th>
            <th class="col-stat" title="Saldo de Gols">SG</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map((entry, i) => renderRow(entry, i)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderRow(entry, idx) {
  const { rank, team, points, goalsDiff, all, form } = entry;
  const meta = getTeam(team.id);

  // Qualificados: top 2 de cada grupo avançam (ou top 8 para os melhores terceiros colocados)
  const isThirdPlaced = String(entry.group || "").toUpperCase().includes("THIRD") || 
                        String(entry.group || "").toUpperCase().includes("TERCEIR");
  const qualClass = isThirdPlaced
    ? (rank <= 8 ? "row--qualified" : "")
    : (rank <= 2 ? "row--qualified" : "");
  // Forma recente (últimos 3 jogos)
  const formHtml  = (form ?? "").slice(-3).split("").map(f => {
    const cls = f === "W" ? "form--w" : f === "D" ? "form--d" : "form--l";
    const label = f === "W" ? "V" : f === "D" ? "E" : "D";
    return `<span class="form-dot ${cls}" title="${f}">${label}</span>`;
  }).join("");

  const gdSign = goalsDiff > 0 ? "+" : "";

  return `
    <tr class="standings-row ${qualClass}">
      <td class="col-rank">${rank}</td>
      <td class="col-team">
        <span class="team-flag">${meta.flag}</span>
        <span class="team-name-short">${esc(meta.abbr)}</span>
        <span class="team-name-full">${esc(meta.name)}</span>
        <div class="team-form">${formHtml}</div>
      </td>
      <td class="col-pts"><strong>${points}</strong></td>
      <td class="col-stat">${all.played}</td>
      <td class="col-stat">${all.win}</td>
      <td class="col-stat">${all.draw}</td>
      <td class="col-stat">${all.lose}</td>
      <td class="col-stat">${all.goals.for}</td>
      <td class="col-stat">${all.goals.against}</td>
      <td class="col-stat ${goalsDiff > 0 ? "positive" : goalsDiff < 0 ? "negative" : ""}">${gdSign}${goalsDiff}</td>
    </tr>
  `;
}
