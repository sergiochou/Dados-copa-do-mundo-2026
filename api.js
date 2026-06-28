/**
 * api.js
 * ─────────────────────────────────────────────────────────────
 * Camada de dados: toda comunicação com a API-Football (ou com
 * os mocks) passa por aqui. Implementa:
 *   • Cache em localStorage (economiza requests diários)
 *   • Tratamento de erros com erros tipados
 *   • Interface idêntica seja mock ou API real
 */

import {
  MOCK_FIXTURES,
  MOCK_STANDINGS,
  MOCK_STATISTICS,
  MOCK_H2H,
  MOCK_TOPSCORERS,
} from "./mockData.js";
import { registerTeam } from "./utils.js";

/* ─────────────────────────────────────────────────────────────
   ⚙️  CONFIGURAÇÃO — EDITE AQUI
   ───────────────────────────────────────────────────────────── */

/**
 * 🔑 Substitua pela sua chave da RapidAPI quando quiser
 *    testar a integração real. Nunca commite a chave real
 *    em um repositório público.
 */
const API_BASE = (window.location.protocol === "file:" || window.location.port === "3000")
  ? "http://127.0.0.1:8000/api"
  : "/api";

/** Parâmetros fixos da Copa do Mundo 2026 */
const LEAGUE = 1;
const SEASON = 2026;

/**
 * USE_REAL_API
 * ┌─────────────────────────────────────────────────────────┐
 * │  false  →  usa os dados locais de mockData.js (seguro)  │
 * │  true   │  faz chamadas reais à RapidAPI (gasta quota)  │
 * └─────────────────────────────────────────────────────────┘
 * Altere para `true` quando quiser testar com dados reais.
 */
export const USE_REAL_API = true;

/* ─────────────────────────────────────────────────────────────
   🗄️  SISTEMA DE CACHE
   ─────────────────────────────────────────────────────────────
   Armazena respostas no localStorage com chave + timestamp.
   O cache expira automaticamente após TTL_MS milissegundos.
   localStorage persiste entre sessões e abas, economizando API quota.
   ───────────────────────────────────────────────────────────── */
const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

const cache = {
  get(key) {
    try {
      const raw = localStorage.getItem(`wc26_${key}`);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > TTL_MS) {
        localStorage.removeItem(`wc26_${key}`);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },
  set(key, data) {
    try {
      localStorage.setItem(`wc26_${key}`, JSON.stringify({ data, ts: Date.now() }));
    } catch (e) {
      // localStorage cheio? Limpa e tenta de novo.
      localStorage.clear();
    }
  },
};

/**
 * Limpa todo o cache local relacionado à Copa 2026.
 */
export function clearCache() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("wc26_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.error("Erro ao limpar localStorage", e);
  }

  // Limpa o cache do backend de forma assíncrona
  fetch(`${API_BASE}/cache/limpar`, { method: "DELETE" })
    .then(res => {
      if (res.ok) console.log("Cache do backend limpo com sucesso.");
      else console.warn("Falha ao limpar cache do backend.");
    })
    .catch(err => console.error("Erro ao tentar limpar cache do backend:", err));
}

/* ─────────────────────────────────────────────────────────────
   🌐  FETCH INTERNO
   ───────────────────────────────────────────────────────────── */
async function apiFetch(endpoint, cacheKey) {
  // 1. Checa cache
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // 2. Requisição real
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(`HTTP ${res.status}`, text || res.statusText, res.status);
  }

  const json = await res.json();

  // 3. Guarda no cache e retorna
  cache.set(cacheKey, json);
  return json;
}

/** Erro tipado para diferenciar erros de rede de erros de negócio */
class ApiError extends Error {
  constructor(title, detail, status = 0) {
    super(detail ? `${title} — ${detail}` : title);
    this.title  = title;
    this.detail = detail;
    this.status = status;
  }
}

/** Simula latência de rede nos mocks para UX realista */
const fakeDelay = (ms = 600) => new Promise(r => setTimeout(r, ms));

/* ─────────────────────────────────────────────────────────────
   📡  FUNÇÕES PÚBLICAS DE DADOS
   ─────────────────────────────────────────────────────────────
   Cada função tem a mesma assinatura independente de mock/real,
   facilitando a troca entre os dois modos.
   ───────────────────────────────────────────────────────────── */

/**
 * fetchFixtures()
 * Retorna TODAS as partidas da Copa 2026 (finalizadas + futuras).
 * Endpoint real: GET /fixtures?league=1&season=2026
 */
export async function fetchFixtures() {
  if (!USE_REAL_API) {
    await fakeDelay(500);
    return MOCK_FIXTURES;
  }
  const data = await apiFetch("/jogos", "fixtures");
  const jogos = data.jogos || [];

  jogos.forEach(j => {
    registerTeam(j.mandante.id, j.mandante.nome, j.mandante.sigla);
    registerTeam(j.visitante.id, j.visitante.nome, j.visitante.sigla);
  });
  
  return {
    response: jogos.map(j => {
      let shortStatus = "NS";
      let longStatus = "Not Started";
      if (j.status === "Encerrado") { shortStatus = "FT"; longStatus = "Match Finished"; }
      else if (j.status === "Ao vivo") { shortStatus = "1H"; longStatus = "In Progress"; }
      else if (j.status === "Intervalo") { shortStatus = "HT"; longStatus = "Halftime"; }

      const gh = j.placar_mandante;
      const ga = j.placar_visitante;
      let homeWinner = null;
      let awayWinner = null;
      if (gh !== null && ga !== null) {
        if (gh > ga) { homeWinner = true; awayWinner = false; }
        else if (gh < ga) { homeWinner = false; awayWinner = true; }
        else { homeWinner = false; awayWinner = false; }
      }

      return {
        fixture: {
          id: j.id,
          date: j.data,
          status: { short: shortStatus, long: longStatus },
          venue: { name: "", city: "" }
        },
        league: { round: j.rodada },
        teams: {
          home: { id: j.mandante.id, name: j.mandante.nome, code: j.mandante.sigla, winner: homeWinner },
          away: { id: j.visitante.id, name: j.visitante.nome, code: j.visitante.sigla, winner: awayWinner }
        },
        goals: { home: gh, away: ga }
      };
    })
  };
}

export async function fetchStandings() {
  if (!USE_REAL_API) {
    await fakeDelay(400);
    return MOCK_STANDINGS;
  }
  const data = await apiFetch("/grupos", "standings");
  
  data.forEach(g => {
    (g.classificacao || []).forEach(t => {
      registerTeam(t.id, t.nome, t.sigla);
    });
  });
  
  const standingsArrays = data.map(g => {
    return g.classificacao.map(t => ({
      rank: t.posicao,
      team: { id: t.id, name: t.nome, code: t.sigla },
      points: t.pontos,
      goalsDiff: t.sg,
      group: g.grupo,
      form: "",
      all: { played: t.jogos, win: t.vitorias, draw: t.empates, lose: t.derrotas, goals: { for: t.gp, against: t.gc } },
      // Deep stats
      media_posse_bola: t.media_posse_bola,
      total_chutes: t.total_chutes,
      chutes_no_alvo: t.chutes_no_alvo,
      escanteios: t.escanteios,
      faltas_cometidas: t.faltas_cometidas,
      cartoes_amarelos: t.cartoes_amarelos,
      cartoes_vermelhos: t.cartoes_vermelhos,
      gols_sofridos: t.gols_sofridos,
      chutes_sofridos: t.chutes_sofridos,
      chutes_no_alvo_sofridos: t.chutes_no_alvo_sofridos,
      laterais: t.laterais,
      impedimentos: t.impedimentos,
      passes: t.passes
    }));
  });

  return {
    response: [
      {
        league: {
          id: 1,
          name: "FIFA World Cup",
          standings: standingsArrays
        }
      }
    ]
  };
}

export async function fetchMatchStats(fixtureId) {
  if (!USE_REAL_API) {
    await fakeDelay(650);
    const data = MOCK_STATISTICS[fixtureId];
    if (!data) throw new ApiError("Mock não encontrado", `Sem estatísticas mock para fixture ${fixtureId}.`);
    return data;
  }
  const data = await apiFetch(`/estatisticas/${fixtureId}`, `stats_${fixtureId}`);
  
  const mapStats = (statsObj) => [
    { type: "Ball Possession", value: statsObj.posse_bola },
    { type: "Total Shots", value: statsObj.chutes_totais },
    { type: "Shots on Goal", value: statsObj.chutes_no_alvo },
    { type: "Fouls", value: statsObj.faltas },
    { type: "Corner Kicks", value: statsObj.escanteios },
    { type: "Offsides", value: statsObj.impedimentos },
    { type: "Yellow Cards", value: statsObj.cartoes_amarelos },
    { type: "Red Cards", value: statsObj.cartoes_vermelhos },
    { type: "Passes", value: statsObj.passes_totais },
    { type: "Throw-ins", value: statsObj.laterais },
    { type: "Pass accuracy", value: statsObj.precisao_passes }
  ].filter(s => s.value !== null && s.value !== undefined);

  return {
    response: [
      { team: { id: 0, name: "Home" }, statistics: mapStats(data.estatisticas_casa || {}) },
      { team: { id: 0, name: "Away" }, statistics: mapStats(data.estatisticas_fora || {}) }
    ]
  };
}

export async function fetchH2H(teamIdA, teamIdB) {
  const [a, b] = [teamIdA, teamIdB].map(Number).sort((x, y) => x - y);
  const h2hKey = `${a}-${b}`;

  if (!USE_REAL_API) {
    await fakeDelay(700);
    const data = MOCK_H2H[h2hKey];
    if (!data) return { response: [] };
    return data;
  }
  
  // O proxy local ainda não suporta histórico H2H
  // Retornamos do mock como fallback ou lista vazia
  return MOCK_H2H[h2hKey] || { response: [] };
}

export async function fetchTopScorers() {
  if (!USE_REAL_API) {
    await fakeDelay(400);
    return MOCK_TOPSCORERS;
  }
  const data = await apiFetch("/artilheiros", "topscorers");
  
  data.forEach(p => {
    registerTeam(p.time_id, p.time, p.sigla);
  });
  
  return {
    response: data.map(p => ({
      player: { id: p.jogador_id, name: p.nome, nationality: "", photo: "" },
      statistics: [{
        goals: { total: p.gols },
        team: { id: p.time_id, name: p.time, code: p.sigla },
        games: { appearances: p.jogos }
      }]
    }))
  };
}

export async function fetchTeamStats2026(teamId) {
  if (!USE_REAL_API) {
    await fakeDelay(500);
    return {
      selecao_id: teamId,
      estatisticas: {
        jogos_jogados: 4,
        media_posse_bola: 55,
        total_chutes: 14,
        chutes_no_alvo: 6,
        escanteios: 5,
        faltas_cometidas: 12,
        cartoes_amarelos: 1.2,
        cartoes_vermelhos: 0.1,
        gols_sofridos: 1.0,
        chutes_sofridos: 9.0,
        chutes_no_alvo_sofridos: 3.0
      },
      jogos: []
    };
  }
  return await apiFetch(`/selecoes/${teamId}/ano-2026`, `team_stats_2026_${teamId}`);
}
