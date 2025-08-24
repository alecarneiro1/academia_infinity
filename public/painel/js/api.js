// public/painel/js/api.js
export async function fetchHistorico(phoneAndIds) {
  const res = await fetch(`/api/historico/${encodeURIComponent(phoneAndIds)}`, {
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "";
    try { const j = await res.json(); detail = j?.detail || j?.error || ""; } catch {}
    const err = new Error(`Falha ao carregar histórico (${res.status})`);
    err.detail = detail;
    throw err;
  }
  return res.json();
}
