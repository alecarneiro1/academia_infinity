// public/painel/js/renderers.js

// util: formata horário local
export function fmtHora(dateStr) {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// util: separador de data (opcional)
export function fmtData(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function renderHeader({ contactNumber }) {
  return `
    <div class="header">
      <div class="header__title">Histórico do Chat</div>
      <div class="header__meta">
        <span><strong>WhatsApp:</strong> wa.me/${contactNumber}</span>
      </div>
    </div>
  `;
}

export function renderCTA(contactNumber, label = "Falar com o contato") {
  return `
    <a class="cta" href="${contactNumber}" target="_blank" rel="noopener noreferrer">
      <span class="cta__icon">💬</span> ${label}
    </a>
  `;
}

// Decide se a mensagem é do "usuário" ou "agente"
function who(msg) {
  if (msg.agentResponse && !msg.userMessage) return "agent";
  if (msg.userMessage && !msg.agentResponse) return "user";
  return msg.id % 2 === 0 ? "user" : "agent";
}

export function renderMessageBubble(msg) {
  const side = who(msg);
  const text =
    side === "agent"
      ? (msg.agentResponse ?? "")
      : (msg.userMessage ?? "");

  const hora = fmtHora(msg.time);
  const name = side === "agent" ? "Bot" : "Você";
  const alt = side === "agent" ? " alt" : "";
  const nameClass = side === "agent" ? "name alt" : "name";

  return `
    <div class="bubble bubble--${side}">
      <div class="bubble__text">${escapeHtml(text)}</div>
      <div class="bubble__time">${hora}</div>
    </div>
  `;
}

export function renderDaySeparator(dateStr) {
  return `<div class="day-sep">${fmtData(dateStr)}</div>`;
}

// Renderiza a lista completa (com separadores de dia)
export function renderChatList(rows) {
  let html = "";
  let lastDay = "";

  for (const r of rows) {
    const day = new Date(r.time).toDateString();
    if (day !== lastDay) {
      if (lastDay) html += ""; // espaço entre dias (se quiser)
      html += renderDaySeparator(r.time);
      lastDay = day;
    }
    html += renderMessageBubble(r);
  }
  return html;
}

// util: escapador simples
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
