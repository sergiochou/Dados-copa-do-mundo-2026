/**
 * app.js — Roteador SPA e controlador principal
 * ─────────────────────────────────────────────────────────────
 * Implementa um roteador hash-based (#home, #standings, etc.)
 * que renderiza a view correta no container principal sem
 * recarregar a página.
 *
 * Fluxo:
 *   1. Usuário clica em aba da navbar
 *   2. window.location.hash é atualizado
 *   3. hashchange event dispara → router carrega a view
 *   4. View busca dados (via api.js) e renderiza no #app-view
 */

import { renderHome }      from "./views/home.js";
import { renderStandings } from "./views/standings.js";
import { renderMatches }   from "./views/matches.js";
import { renderTeams }     from "./views/teams.js";
import { USE_REAL_API, clearCache } from "./api.js";
import { showToast }       from "./utils.js";
import { loadSheetJS, exportAllDataToExcel } from "./excelExport.js";

/* ─── Definição das rotas ────────────────────────────────────── */
const ROUTES = {
  "#home":      { label: "Resumo",    render: renderHome      },
  "#standings": { label: "Grupos",    render: renderStandings },
  "#teams":     { label: "Seleções",  render: renderTeams     },
  "#matches":   { label: "Jogos",     render: renderMatches   },
};

const DEFAULT_ROUTE = "#home";

/* ─── Estado do roteador ─────────────────────────────────────── */
let currentRoute = null;

/* ─── Inicialização ──────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  buildNavbar();
  updateModeIndicator();
  attachNavEvents();
  attachMobileMenuToggle();
  attachSyncEvent();
  attachExportEvent();

  // Rota inicial: usa hash da URL ou padrão
  const initialHash = Object.keys(ROUTES).includes(window.location.hash)
    ? window.location.hash
    : DEFAULT_ROUTE;

  navigate(initialHash, true);

  // Escuta mudanças de hash (botão voltar/avançar do browser)
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash;
    if (ROUTES[hash]) navigate(hash);
  });
});

/* ─── Roteamento ─────────────────────────────────────────────── */

async function navigate(hash, skipHashUpdate = false, force = false) {
  const route = ROUTES[hash];
  if (!route) return;
  if (hash === currentRoute && !force) return;

  currentRoute = hash;

  // Atualiza URL sem disparar hashchange de novo
  if (!skipHashUpdate) {
    history.pushState(null, "", hash);
  } else {
    // Garante que o hash está na URL no carregamento inicial
    window.location.hash = hash;
  }

  // Ativa aba correta na navbar
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.hash === hash);
    tab.setAttribute("aria-selected", tab.dataset.hash === hash);
  });

  // Fecha menu mobile se estiver aberto
  closeMobileMenu();

  // Renderiza a view no container principal
  const container = document.getElementById("app-view");
  await route.render(container);
}

/* ─── Construção da navbar ───────────────────────────────────── */

function buildNavbar() {
  const navList = document.getElementById("nav-list");
  if (!navList) return;

  navList.innerHTML = Object.entries(ROUTES).map(([hash, route]) => `
    <li role="none">
      <button
        class="nav-tab"
        data-hash="${hash}"
        role="tab"
        aria-selected="false"
        aria-controls="app-view"
      >
        ${getTabIcon(hash)}
        <span>${route.label}</span>
      </button>
    </li>
  `).join("");
}

function getTabIcon(hash) {
  const icons = {
    "#home":      "🏠",
    "#standings": "📊",
    "#teams":     "🌍",
    "#matches":   "⚽",
  };
  return `<span class="nav-tab__icon" aria-hidden="true">${icons[hash] ?? ""}</span>`;
}

function attachNavEvents() {
  document.getElementById("nav-list")?.addEventListener("click", e => {
    const tab = e.target.closest(".nav-tab");
    if (tab?.dataset.hash) navigate(tab.dataset.hash);
  });
}

function attachSyncEvent() {
  const syncBtn = document.getElementById("sync-button");
  if (!syncBtn) return;

  syncBtn.addEventListener("click", async () => {
    // Evita cliques duplos se já estiver sincronizando
    if (syncBtn.classList.contains("btn-sync--syncing")) return;

    // Ativa animação visual no botão
    syncBtn.classList.add("btn-sync--syncing");
    const textSpan = syncBtn.querySelector(".btn-sync__text");
    if (textSpan) textSpan.textContent = "Sincronizando...";

    try {
      // Limpa todo o cache
      clearCache();

      // Força a atualização da view atual
      if (currentRoute) {
        await navigate(currentRoute, true, true);
      }
      showToast("Dados sincronizados com sucesso!", "success");
    } catch (error) {
      console.error("Falha ao sincronizar", error);
      showToast("Erro ao sincronizar dados da API.", "error");
    } finally {
      // Desativa animação e restaura estado original
      syncBtn.classList.remove("btn-sync--syncing");
      if (textSpan) textSpan.textContent = "Sincronizar";
    }
  });
}

/* ─── Menu mobile ────────────────────────────────────────────── */

function attachMobileMenuToggle() {
  const btn     = document.getElementById("menu-toggle");
  const navList = document.getElementById("nav-list");
  const overlay = document.getElementById("nav-overlay");

  btn?.addEventListener("click", () => {
    const isOpen = navList.classList.toggle("mobile-open");
    btn.setAttribute("aria-expanded", isOpen);
    overlay.classList.toggle("hidden", !isOpen);
  });

  overlay?.addEventListener("click", closeMobileMenu);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeMobileMenu();
  });
}

function closeMobileMenu() {
  document.getElementById("nav-list")?.classList.remove("mobile-open");
  document.getElementById("menu-toggle")?.setAttribute("aria-expanded", "false");
  document.getElementById("nav-overlay")?.classList.add("hidden");
}

/* ─── Indicador de modo (Mock / API Real) ────────────────────── */

function updateModeIndicator() {
  const indicator = document.getElementById("mode-indicator");
  if (!indicator) return;

  if (USE_REAL_API) {
    indicator.textContent  = "API Real";
    indicator.className    = "mode-badge mode-badge--live";
    showToast("Modo API Real ativo — suas requisições estão sendo consumidas.", "info");
  } else {
    indicator.textContent = "Mock";
    indicator.className   = "mode-badge mode-badge--mock";
  }
}

function attachExportEvent() {
  const exportBtn = document.getElementById("export-excel-btn");
  if (!exportBtn) return;

  exportBtn.addEventListener("click", async () => {
    // Evita cliques duplos se já estiver exportando
    if (exportBtn.classList.contains("btn-sync--syncing")) return;

    // Ativa animação visual no botão
    exportBtn.classList.add("btn-sync--syncing");
    const textSpan = exportBtn.querySelector(".btn-sync__text");
    if (textSpan) textSpan.textContent = "Exportando...";

    try {
      // Carrega SheetJS de forma assíncrona
      await loadSheetJS();
      // Gera o Excel
      await exportAllDataToExcel();
      showToast("Planilha Excel gerada com sucesso!", "success");
    } catch (error) {
      console.error("Falha ao exportar Excel", error);
      showToast(error.message || "Erro ao exportar dados para Excel.", "error");
    } finally {
      // Desativa animação e restaura estado original
      exportBtn.classList.remove("btn-sync--syncing");
      if (textSpan) textSpan.textContent = "Exportar Excel";
    }
  });
}
