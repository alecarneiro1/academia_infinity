// public/painel/js/historico.js
import { fetchHistorico } from "./api.js";
import { renderHeader, renderCTA, renderChatList } from "./renderers.js";

function getPhoneAndIdsFromPath() {
  // path esperado: /historico/:phoneAndIds
  // ex: /historico/554291562180-1,2,3
  const parts = window.location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("historico");
  if (idx === -1 || !parts[idx + 1]) return null;
  return parts[idx + 1];
}

function scrollToBottom() {
  const container = document.getElementById("chatList");
  if (!container) return;
  container.scrollTop = container.scrollHeight;
}

async function main() {
  const phoneAndIds = getPhoneAndIdsFromPath();
  const headerEl = document.getElementById("chatHeader");
  const chatEl = document.getElementById("chatList");
  const ctaEl = document.getElementById("chatCta");
  const errorEl = document.getElementById("chatError");

  if (!phoneAndIds) {
    if (errorEl) errorEl.textContent = "Parâmetro inválido de histórico na URL.";
    return;
  }

  try {
    const data = await fetchHistorico(phoneAndIds);
    // Header
    if (headerEl) headerEl.innerHTML = renderHeader({ contactNumber: data.contactNumber });

    // Lista
    if (chatEl) chatEl.innerHTML = renderChatList(data.rows);

    // CTA
    if (ctaEl) ctaEl.innerHTML = renderCTA(data.contactNumber, "Falar com o contato");

    // Scroll
    scrollToBottom();
  } catch (err) {
    if (errorEl) {
      errorEl.innerHTML = `
        <div class="error">
          <div><strong>Erro:</strong> ${err.message}</div>
          ${err.detail ? `<div class="error__detail">${err.detail}</div>` : ""}
        </div>
      `;
    }
  }
}

document.addEventListener("DOMContentLoaded", main);
