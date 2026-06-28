/**
 * excelExport.js
 * ─────────────────────────────────────────────────────────────
 * Módulo utilitário para carregar dinamicamente a biblioteca SheetJS (XLSX)
 * e gerar um arquivo Excel formatado com múltiplas abas contendo os dados do dashboard.
 */

import { fetchFixtures, fetchStandings, fetchTopScorers } from "./api.js";

/**
 * Carrega a biblioteca SheetJS via CDN de forma assíncrona, caso não esteja carregada.
 */
export function loadSheetJS() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) return resolve();
    
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.onload = () => {
      console.log("SheetJS carregado com sucesso.");
      resolve();
    };
    script.onerror = (err) => {
      console.error("Erro ao carregar SheetJS", err);
      reject(new Error("Falha ao carregar a biblioteca de exportação para Excel. Verifique sua conexão."));
    };
    document.head.appendChild(script);
  });
}

/**
 * Busca todos os dados da API e gera o download do arquivo Excel estruturado.
 */
export async function exportAllDataToExcel() {
  if (!window.XLSX) {
    throw new Error("Biblioteca de exportação não inicializada.");
  }

  // 1. Busca todos os dados concorrentemente
  const [fixturesData, standingsData, scorersData] = await Promise.all([
    fetchFixtures(),
    fetchStandings(),
    fetchTopScorers()
  ]);

  // 2. Formata Aba: JOGOS
  const matches = fixturesData.response || [];
  const matchesSheetData = matches.map(m => {
    const goalsHome = m.goals.home !== null && m.goals.home !== undefined ? m.goals.home : "";
    const goalsAway = m.goals.away !== null && m.goals.away !== undefined ? m.goals.away : "";
    const scoreStr = m.fixture.status.short === "NS" ? "vs" : `${goalsHome} - ${goalsAway}`;
    
    let formattedDate = m.fixture.date;
    try {
      const d = new Date(m.fixture.date);
      formattedDate = d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    } catch (e) {}

    return {
      "ID da Partida": m.fixture.id,
      "Data e Hora (Horário de Brasília)": formattedDate,
      "Fase / Rodada": m.league.round,
      "Seleção Mandante": m.teams.home.name,
      "Placar": scoreStr,
      "Seleção Visitante": m.teams.away.name,
      "Gols Mandante": goalsHome,
      "Gols Visitante": goalsAway,
      "Status": m.fixture.status.short === "FT" ? "Encerrado" : 
                ["1H", "2H", "HT"].includes(m.fixture.status.short) ? "Ao Vivo" : "Não Iniciado"
    };
  });

  // 3. Formata Abas: CLASSIFICAÇÃO e ESTATÍSTICAS DAS SELEÇÕES
  const standingsSheetData = [];
  const selectionsSheetData = [];
  const groupsList = (standingsData.response && standingsData.response[0]?.league?.standings) || [];
  
  groupsList.forEach(groupTeams => {
    groupTeams.forEach(t => {
      // Aba: Classificação simples
      standingsSheetData.push({
        "Grupo": t.group,
        "Posição": t.rank,
        "Seleção": t.team.name,
        "Sigla": t.team.code,
        "Pontos": t.points,
        "Jogos": t.all.played,
        "Vitórias": t.all.win,
        "Empates": t.all.draw,
        "Derrotas": t.all.lose,
        "Gols Feitos (GP)": t.all.goals.for,
        "Gols Sofridos (GC)": t.all.goals.against,
        "Saldo de Gols (SG)": t.goalsDiff
      });

      // Aba: Estatísticas aprofundadas por seleção
      selectionsSheetData.push({
        "Seleção": t.team.name,
        "Grupo": t.group,
        "Pontos": t.points,
        "Jogos": t.all.played,
        "Vitórias": t.all.win,
        "Empates": t.all.draw,
        "Derrotas": t.all.lose,
        "Gols Feitos (GP)": t.all.goals.for,
        "Gols Sofridos (GC)": t.all.goals.against,
        "Saldo de Gols (SG)": t.goalsDiff,
        "Média Posse de Bola": t.media_posse_bola !== null && t.media_posse_bola !== undefined ? `${t.media_posse_bola}%` : "N/A",
        "Chutes/Jogo": t.total_chutes !== null && t.total_chutes !== undefined ? t.total_chutes : "N/A",
        "Chutes no Alvo/Jogo": t.chutes_no_alvo !== null && t.chutes_no_alvo !== undefined ? t.chutes_no_alvo : "N/A",
        "Escanteios/Jogo": t.escanteios !== null && t.escanteios !== undefined ? t.escanteios : "N/A",
        "Faltas Cometidas/Jogo": t.faltas_cometidas !== null && t.faltas_cometidas !== undefined ? t.faltas_cometidas : "N/A",
        "Cartões Amarelos/Jogo": t.cartoes_amarelos !== null && t.cartoes_amarelos !== undefined ? t.cartoes_amarelos : "N/A",
        "Cartões Vermelhos/Jogo": t.cartoes_vermelhos !== null && t.cartoes_vermelhos !== undefined ? t.cartoes_vermelhos : "N/A",
        "Gols Sofridos/Jogo": t.gols_sofridos !== null && t.gols_sofridos !== undefined ? t.gols_sofridos : "N/A",
        "Chutes Sofridos/Jogo": t.chutes_sofridos !== null && t.chutes_sofridos !== undefined ? t.chutes_sofridos : "N/A",
        "Chutes no Alvo Sofridos/Jogo": t.chutes_no_alvo_sofridos !== null && t.chutes_no_alvo_sofridos !== undefined ? t.chutes_no_alvo_sofridos : "N/A",
        "Laterais/Jogo": t.laterais !== null && t.laterais !== undefined ? t.laterais : "N/A",
        "Impedimentos/Jogo": t.impedimentos !== null && t.impedimentos !== undefined ? t.impedimentos : "N/A",
        "Passes/Jogo": t.passes !== null && t.passes !== undefined ? t.passes : "N/A"
      });
    });
  });

  // Ordena a aba de Estatísticas das Seleções alfabeticamente
  selectionsSheetData.sort((a, b) => a["Seleção"].localeCompare(b["Seleção"]));

  // 4. Formata Aba: ARTILHEIROS
  const scorers = scorersData.response || [];
  const scorersSheetData = scorers.map((s, idx) => {
    const stat = s.statistics[0] || {};
    const appearances = stat.games?.appearances !== null && stat.games?.appearances !== undefined ? stat.games.appearances : "N/A";
    return {
      "Posição": idx + 1,
      "Jogador": s.player.name,
      "Seleção": stat.team?.name || "N/A",
      "Gols": stat.goals?.total || 0,
      "Jogos (Aparições)": appearances
    };
  });

  // 5. Cria o Livro de Trabalho (Workbook) do SheetJS
  const wb = window.XLSX.utils.book_new();

  // Converte dados JSON em planilhas do SheetJS
  const wsMatches = window.XLSX.utils.json_to_sheet(matchesSheetData);
  const wsStandings = window.XLSX.utils.json_to_sheet(standingsSheetData);
  const wsSelections = window.XLSX.utils.json_to_sheet(selectionsSheetData);
  const wsScorers = window.XLSX.utils.json_to_sheet(scorersSheetData);

  // Define larguras padrão para colunas (melhor legibilidade inicial)
  const setColsWidth = (ws) => {
    ws["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  };
  setColsWidth(wsMatches);
  wsStandings["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  wsSelections["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 15 }];
  wsScorers["!cols"] = [{ wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 10 }, { wch: 18 }];

  // Adiciona as abas ao livro de trabalho
  window.XLSX.utils.book_append_sheet(wb, wsMatches, "Jogos");
  window.XLSX.utils.book_append_sheet(wb, wsStandings, "Classificação (Grupos)");
  window.XLSX.utils.book_append_sheet(wb, wsSelections, "Estatísticas das Seleções");
  window.XLSX.utils.book_append_sheet(wb, wsScorers, "Artilheiros");

  // 6. Efetua a gravação e o download automático do arquivo XLSX
  window.XLSX.writeFile(wb, "Copa_do_Mundo_2026_Dashboard.xlsx");
}
