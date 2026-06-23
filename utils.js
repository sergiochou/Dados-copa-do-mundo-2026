/**
 * utils.js
 * ─────────────────────────────────────────────────────────────
 * Utilitários compartilhados entre todas as views:
 *   • Metadados de seleções (bandeiras, cores, abreviações)
 *   • Helpers de DOM (loader, toast, escape XSS)
 *   • Formatadores de data e valor
 */

/* ─────────────────────────────────────────────────────────────
   🌍  METADADOS DAS SELEÇÕES
   ───────────────────────────────────────────────────────────── */
export const TEAMS = {
  6:    { name: "Brasil",       abbr: "BRA", flag: "🇧🇷", color: "#009C3B", bg: "#002776" },
  13:   { name: "Croácia",      abbr: "CRO", flag: "🇭🇷", color: "#CC0000", bg: "#0044AA" },
  26:   { name: "Argentina",    abbr: "ARG", flag: "🇦🇷", color: "#74ACDF", bg: "#003087" },
  27:   { name: "Portugal",     abbr: "POR", flag: "🇵🇹", color: "#006600", bg: "#C9002B" },
  24:   { name: "Polônia",      abbr: "POL", flag: "🇵🇱", color: "#DC143C", bg: "#FFFFFF" },
  56:   { name: "Arábia Saudita",abbr:"KSA", flag: "🇸🇦", color: "#006C35", bg: "#FFFFFF" },
  2:    { name: "França",       abbr: "FRA", flag: "🇫🇷", color: "#0055A4", bg: "#EF4135" },
  25:   { name: "Alemanha",     abbr: "GER", flag: "🇩🇪", color: "#000000", bg: "#DD0000" },
  9:    { name: "Espanha",      abbr: "ESP", flag: "🇪🇸", color: "#AA151B", bg: "#F1BF00" },
  1569: { name: "Marrocos",     abbr: "MAR", flag: "🇲🇦", color: "#C1272D", bg: "#006233" },
  29:   { name: "Marrocos",     abbr: "MAR", flag: "🇲🇦", color: "#C1272D", bg: "#006233" },
  34:   { name: "Japão",        abbr: "JPN", flag: "🇯🇵", color: "#BC002D", bg: "#FFFFFF" },
  769:  { name: "México",       abbr: "MEX", flag: "🇲🇽", color: "#006847", bg: "#CE1126" },
  21:   { name: "Colômbia",     abbr: "COL", flag: "🇨🇴", color: "#FCD116", bg: "#003087" },
  102:  { name: "Camarões",     abbr: "CMR", flag: "🇨🇲", color: "#007A5E", bg: "#CE1126" },
  1529: { name: "Canadá",       abbr: "CAN", flag: "🇨🇦", color: "#FF0000", bg: "#FFFFFF" },
};

// Registro dinâmico de times (populado à medida que a API retorna dados)
const REGISTERED_TEAMS = {};

const FLAG_MAP = {
  "brasil": "🇧🇷", "brazil": "🇧🇷", "bra": "🇧🇷",
  "argentina": "🇦🇷", "arg": "🇦🇷",
  "frança": "🇫🇷", "france": "🇫🇷", "fra": "🇫🇷",
  "alemanha": "🇩🇪", "germany": "🇩🇪", "ger": "🇩🇪",
  "espanha": "🇪🇸", "spain": "🇪🇸", "esp": "🇪🇸",
  "portugal": "🇵🇹", "por": "🇵🇹",
  "itália": "🇮🇹", "italy": "🇮🇹", "ita": "🇮🇹",
  "inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "england": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "eng": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "holanda": "🇳🇱", "netherlands": "🇳🇱", "ned": "🇳🇱",
  "bélgica": "🇧🇪", "belgium": "🇧🇪", "bel": "🇧🇪",
  "croácia": "🇭🇷", "croatia": "🇭🇷", "cro": "🇭🇷",
  "uruguai": "🇺🇾", "uruguay": "🇺🇾", "uru": "🇺🇾",
  "colômbia": "🇨🇴", "colombia": "🇨🇴", "col": "🇨🇴",
  "marrocos": "🇲🇦", "morocco": "🇲🇦", "mar": "🇲🇦",
  "japão": "🇯🇵", "japan": "🇯🇵", "jpn": "🇯🇵",
  "méxico": "🇲🇽", "mexico": "🇲🇽", "mex": "🇲🇽",
  "camarões": "🇨🇲", "cameroon": "🇨🇲", "cmr": "🇨🇲",
  "canadá": "🇨🇦", "canada": "🇨🇦", "can": "🇨🇦",
  "estados unidos": "🇺🇸", "usa": "🇺🇸", "united states": "🇺🇸",
  "equador": "🇪🇨", "ecuador": "🇪🇨", "ecu": "🇪🇨",
  "suíça": "🇨🇭", "switzerland": "🇨🇭", "sui": "🇨🇭",
  "senegal": "🇸🇳", "sen": "🇸🇳",
  "sul": "🇰🇷", "south korea": "🇰🇷", "kor": "🇰🇷", "coréia do sul": "🇰🇷",
  "república tcheca": "🇨🇿", "czechia": "🇨🇿", "cze": "🇨🇿", "czech republic": "🇨🇿",
  "áfrica do sul": "🇿🇦", "south africa": "🇿🇦", "rsa": "🇿🇦",
  "gales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "wal": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "dinamarca": "🇩🇰", "denmark": "🇩🇰", "den": "🇩🇰",
  "polônia": "🇵🇱", "poland": "🇵🇱", "pol": "🇵🇱",
  "sérvia": "🇷🇸", "serbia": "🇷🇸", "srb": "🇷🇸",
  "gana": "🇬🇭", "ghana": "🇬🇭", "gha": "🇬🇭",
  "tunísia": "🇹🇳", "tunisia": "🇹🇳", "tun": "🇹🇳",
  "costa rica": "🇨🇷", "crc": "🇨🇷",
  "catar": "🇶🇦", "qatar": "🇶🇦", "qat": "🇶🇦",
  "arábia saudita": "🇸🇦", "saudi arabia": "🇸🇦", "sau": "🇸🇦", "ksa": "🇸🇦",
  "irã": "🇮🇷", "iran": "🇮🇷", "irn": "🇮🇷",
  "austrália": "🇦🇺", "australia": "🇦🇺", "aus": "🇦🇺",
  "suécia": "🇸🇪", "sweden": "🇸🇪", "swe": "🇸🇪",
  "ucrânia": "🇺🇦", "ukraine": "🇺🇦", "ukr": "🇺🇦",
  "escócia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "sco": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "turquia": "🇹🇷", "turkey": "🇹🇷", "tur": "🇹🇷",
  "egito": "🇪🇬", "egypt": "🇪🇬", "egy": "🇪🇬",
  "argélia": "🇩🇿", "algeria": "🇩🇿", "alg": "🇩🇿",
  "nigéria": "🇳🇬", "nigeria": "🇳🇬", "nga": "🇳🇬",
  "costa do marfim": "🇨🇮", "cote d'ivoire": "🇨🇮", "civ": "🇨🇮", "ivory coast": "🇨🇮",
  "peru": "🇵🇪", "per": "🇵🇪",
  "chile": "🇨🇱", "chi": "🇨🇱",
  "paraguai": "🇵🇾", "paraguay": "🇵🇾", "par": "🇵🇾",
  "venezuela": "🇻🇪", "ven": "🇻🇪",
  "panamá": "🇵🇦", "panama": "🇵🇦", "pan": "🇵🇦",
  "honduras": "🇭🇳", "hon": "🇭🇳",
  "jamaica": "🇯🇲", "jam": "🇯🇲",
  "nova zelândia": "🇳🇿", "new zealand": "🇳🇿", "nzl": "🇳🇿",
  "iraque": "🇮🇶", "iraq": "🇮🇶", "irq": "🇮🇶",
  "emirados árabes": "🇦🇪", "uae": "🇦🇪", "united arab emirates": "🇦🇪",
  "uzbequistão": "🇺🇿", "uzbekistan": "🇺🇿", "uzb": "🇺🇿",
  "china": "🇨🇳", "chn": "🇨🇳",
  "omã": "🇴🇲", "oman": "🇴🇲", "oma": "🇴🇲"
};

const THREE_TO_TWO = {
  "ARG": "ar", "AUS": "au", "AUT": "at", "BEL": "be", "BIH": "ba", "BRA": "br",
  "CAN": "ca", "CIV": "ci", "CMR": "cm", "COD": "cd", "COL": "co", "CPV": "cv",
  "CRC": "cr", "CRO": "hr", "CUR": "cw", "CZE": "cz", "DCO": "cd", "DEU": "de",
  "DNK": "dk", "DZA": "dz", "ECU": "ec", "EGY": "eg", "ENG": "gb-eng", "ESP": "es",
  "FRA": "fr", "GER": "de", "GHA": "gh", "HAI": "ht", "HON": "hn", "HRV": "hr",
  "IRN": "ir", "IRQ": "iq", "IRA": "iq", "IRI": "ir", "ISL": "is", "ITA": "it",
  "JAM": "jm", "JOR": "jo", "JPN": "jp", "KOR": "kr", "KSA": "sa", "MAR": "ma",
  "MEX": "mx", "NGA": "ng", "NLD": "nl", "NED": "nl", "NOR": "no", "NZL": "nz",
  "PAN": "pa", "PAR": "py", "POL": "pl", "POR": "pt", "PRT": "pt", "QAT": "qa",
  "RSA": "za", "RUS": "ru", "SAU": "sa", "SCO": "gb-sct", "SEN": "sn", "SRB": "rs",
  "SUI": "ch", "SWE": "se", "TUN": "tn", "TUR": "tr", "UKR": "ua", "URU": "uy",
  "USA": "us", "UZB": "uz", "WAL": "gb-wls"
};

const SUBDIVISIONS = {
  "🏴󠁧󠁢󠁳󠁣󠁴󠁿": "gb-sct",
  "🏴󠁧󠁢󠁷󠁬󠁳󠁿": "gb-wls",
  "🏴󠁧󠁢󠁥󠁮󠁧󠁿": "gb-eng",
};

function emojiToCountryCode(emoji) {
  if (!emoji || emoji.length < 4) return null;
  const charCode1 = emoji.codePointAt(0);
  const charCode2 = emoji.codePointAt(2);
  if (charCode1 >= 0x1F1E6 && charCode1 <= 0x1F1FF && charCode2 >= 0x1F1E6 && charCode2 <= 0x1F1FF) {
    const code = String.fromCharCode(charCode1 - 0x1F1A5) + String.fromCharCode(charCode2 - 0x1F1A5);
    return code.toLowerCase();
  }
  return null;
}

export function getFlagHtml(flagEmoji) {
  if (!flagEmoji || flagEmoji === "🏳️" || flagEmoji === "🏳") {
    return `<span class="flag-icon">🏳️</span>`;
  }
  
  if (SUBDIVISIONS[flagEmoji]) {
    const code = SUBDIVISIONS[flagEmoji];
    return `<img class="flag-img" src="https://flagcdn.com/w40/${code}.png" alt="Bandeira" style="height: 1em; width: auto; vertical-align: middle; border-radius: 2px; display: inline-block;" onerror="this.outerHTML='${flagEmoji}'" />`;
  }

  const code = emojiToCountryCode(flagEmoji);
  if (code) {
    return `<img class="flag-img" src="https://flagcdn.com/w40/${code}.png" alt="Bandeira" style="height: 1em; width: auto; vertical-align: middle; border-radius: 2px; display: inline-block;" onerror="this.outerHTML='${flagEmoji}'" />`;
  }

  return `<span class="flag-icon">${flagEmoji}</span>`;
}

function getFlagEmoji(name, abbr) {
  const n = String(name || "").toLowerCase().trim();
  const a = String(abbr || "").toUpperCase().trim();
  
  if (THREE_TO_TWO[a]) {
    const code = THREE_TO_TWO[a];
    if (code.startsWith("gb-")) {
      if (code === "gb-sct") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
      if (code === "gb-wls") return "🏴󠁧󠁢󠁷󠁬󠁳󠁿";
      if (code === "gb-eng") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
    } else {
      return String.fromCodePoint(
        code.toUpperCase().charCodeAt(0) + 127397,
        code.toUpperCase().charCodeAt(1) + 127397
      );
    }
  }

  const a_low = a.toLowerCase();
  if (FLAG_MAP[n]) return FLAG_MAP[n];
  if (FLAG_MAP[a_low]) return FLAG_MAP[a_low];
  
  for (const [key, value] of Object.entries(FLAG_MAP)) {
    if (key.length > 3 && n.includes(key)) {
      return value;
    }
  }
  return "🏳️";
}

// Inicializa as bandeiras do TEAMS estático para usar HTML compatível com Windows/Cdn
Object.keys(TEAMS).forEach(id => {
  TEAMS[id].flag = getFlagHtml(TEAMS[id].flag);
});

export function registerTeam(id, name, code) {
  if (!id) return;
  if (REGISTERED_TEAMS[id]) {
    if (name && !REGISTERED_TEAMS[id].name) REGISTERED_TEAMS[id].name = name;
    if (code && !REGISTERED_TEAMS[id].abbr) REGISTERED_TEAMS[id].abbr = code;
    return;
  }
  
  const flagEmoji = getFlagEmoji(name, code);
  const flagHtml = getFlagHtml(flagEmoji);
  
  REGISTERED_TEAMS[id] = {
    name: name || String(id),
    abbr: code || (name ? name.slice(0, 3).toUpperCase() : "???"),
    flag: flagHtml,
    color: "#D4AF37",
    bg: "#1F2638"
  };
}

/** Retorna metadados de um time, com fallback seguro */
export function getTeam(idOrName) {
  if (idOrName && typeof idOrName === "object") {
    const id = idOrName.id;
    const name = idOrName.name || idOrName.nome;
    const code = idOrName.code || idOrName.sigla || idOrName.nameCode;
    registerTeam(id, name, code);
    return REGISTERED_TEAMS[id];
  }

  // Tenta por ID numérico primeiro
  if (TEAMS[idOrName]) return TEAMS[idOrName];

  // Tenta no registro dinâmico
  if (REGISTERED_TEAMS[idOrName]) return REGISTERED_TEAMS[idOrName];

  // Fallback: busca pelo campo name (API usa nome em inglês)
  const entry = Object.values(TEAMS).find(
    t => t.name.toLowerCase() === String(idOrName).toLowerCase()
  );
  if (entry) return entry;

  // Busca por nome no registro dinâmico
  const dynEntry = Object.values(REGISTERED_TEAMS).find(
    t => t.name.toLowerCase() === String(idOrName).toLowerCase()
  );
  if (dynEntry) return dynEntry;

  return { name: String(idOrName), abbr: "???", flag: "🏳️", color: "#D4AF37", bg: "#1F2638" };
}

/* ─────────────────────────────────────────────────────────────
   🛠️  HELPERS DE DOM
   ───────────────────────────────────────────────────────────── */

/** Escapa caracteres HTML para prevenir XSS */
export function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Substitui o conteúdo de um elemento por HTML seguro */
export function setHTML(el, html) {
  if (typeof el === "string") el = document.querySelector(el);
  if (el) el.innerHTML = html;
}

/**
 * showLoader(container)
 * Renderiza um spinner centralizado dentro do container.
 */
export function showLoader(container) {
  setHTML(container, `
    <div class="loader-wrap" role="status" aria-label="Carregando…">
      <div class="spinner"></div>
      <span class="loader-text">Carregando…</span>
    </div>
  `);
}

/**
 * showError(container, message)
 * Exibe um estado de erro com mensagem amigável.
 */
export function showError(container, message = "Algo deu errado. Tente novamente.") {
  setHTML(container, `
    <div class="error-state">
      <span class="error-icon">⚠️</span>
      <p>${esc(message)}</p>
    </div>
  `);
}

/**
 * showToast(message, type?)
 * Notificação flutuante temporária. type: "info" | "success" | "error"
 */
export function showToast(message, type = "info") {
  const existing = document.getElementById("toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast";
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Animação de entrada
  requestAnimationFrame(() => toast.classList.add("toast--visible"));

  // Remove após 3.5s
  setTimeout(() => {
    toast.classList.remove("toast--visible");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ─────────────────────────────────────────────────────────────
   📅  FORMATADORES
   ───────────────────────────────────────────────────────────── */

/** Formata ISO date para "15 jun. 2026, 18h00" em PT-BR */
export function fmtDate(isoStr, opts = {}) {
  const defaults = {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
    hour:  "2-digit",
    minute:"2-digit",
    timeZone: "America/Sao_Paulo",
  };
  return new Date(isoStr).toLocaleString("pt-BR", { ...defaults, ...opts });
}

/** Formata apenas a data: "15 jun. 2026" */
export function fmtDateShort(isoStr) {
  return new Date(isoStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo",
  });
}

/** Extrai valor numérico de stat value ("62%" → 62, 18 → 18, null → 0) */
export function parseStatVal(val) {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  return parseInt(String(val).replace("%", ""), 10) || 0;
}

/** Traduz o nome da rodada para PT-BR */
export function translateRound(round = "") {
  const map = {
    "Group Stage":   "Fase de Grupos",
    "Round of 16":  "Oitavas de Final",
    "Quarter-finals":"Quartas de Final",
    "Semi-finals":  "Semifinais",
    "3rd Place Final":"Disputa de 3º Lugar",
    "Final":        "Final",
  };
  // Tenta match exato, depois tenta match parcial para "Group Stage - 1" etc.
  if (map[round]) return map[round];
  const partial = Object.entries(map).find(([k]) => round.startsWith(k));
  return partial ? partial[1] : round;
}

/** Traduz status curto de partida */
export function translateStatus(short = "") {
  const map = { FT: "Encerrado", NS: "Não iniciado", LIVE: "Ao vivo", HT: "Intervalo", PST: "Adiado" };
  return map[short] ?? short;
}
