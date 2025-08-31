document.addEventListener('DOMContentLoaded', function () {
  const searchInput      = document.getElementById('contact-search');
  const autocompleteList = document.getElementById('autocomplete-list');
  const mensagensRoot    = document.getElementById('mensagens');

  // ---------- Soft navigation (muda URL sem reload e sem scroll) ----------
  async function softNavigate(url, opts = { push: true }) {
    const keepY = window.scrollY; // preserva posição de rolagem
    try {
      const res = await fetch(url, { headers: { 'X-Requested-With': 'soft-nav' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // novos pedaços vindos do servidor SSR
      const newMsgs = doc.getElementById('chat-messages');
      const newDP   = doc.getElementById('datepicker-wrap');

      // alvos atuais na página
      const curMsgs = document.getElementById('chat-messages');
      const curDP   = document.getElementById('datepicker-wrap');
      const form    = document.querySelector('form.msg-filter');

      if (!newMsgs || !form) {
        // fallback: navegação normal
        window.location.href = url;
        return;
      }

      // --- FADE OUT das mensagens antigas ---
      if (curMsgs) {
        curMsgs.querySelectorAll('.msg').forEach(el => {
          el.classList.add('fade-out');
        });
      }

      // troca mensagens com fade-in nas novas
      setTimeout(() => {
        if (curMsgs) {
          curMsgs.replaceWith(newMsgs);
        } else {
          form.after(newMsgs);
        }
        // FADE IN nas novas bolhas
        newMsgs.querySelectorAll('.msg').forEach(el => {
          el.classList.add('fade-in');
          setTimeout(() => el.classList.remove('fade-in'), 400);
        });
      }, curMsgs ? 220 : 0); // espera fade-out antes de trocar

      // troca datepicker (pode existir ou não)
      if (curDP) curDP.remove();
      if (newDP) {
        const searchRow = form.querySelector('.search-row');
        if (searchRow) searchRow.insertAdjacentElement('afterend', newDP);
        else form.appendChild(newDP);
      }

      if (opts.push) history.pushState(null, '', url);

      // sincroniza seleção no novo datepicker (se houver ids na url)
      try {
        const idsNow = extractIdsFromUrl(url);
        setSelectedDayInDatepicker(idsNow);
      } catch (err) { /* silent */ }

      // volta exata posição anterior
      window.scrollTo({ top: keepY });
      // fecha autocomplete se aberto
      if (autocompleteList) autocompleteList.style.display = 'none';
    } catch (e) {
      // qualquer erro -> navegação tradicional
      window.location.href = url;
    }
  }

  // back/forward do navegador
  window.addEventListener('popstate', () => {
    softNavigate(location.pathname + location.search, { push: false });
  });

  // delega cliques internos no artigo (links do datepicker e "todas mensagens")
  if (mensagensRoot) {
    mensagensRoot.addEventListener('click', function (e) {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      // só intercepta nossas rotas
      if (href.startsWith('/admin/chatlogs')) {
        e.preventDefault();

        // marca seleção visual imediatamente no elemento clicado (se for dp-day)
        try {
          const grid = document.querySelector('.date-picker__grid');
          if (grid) grid.querySelectorAll('.dp-day.is-selected').forEach(el => el.classList.remove('is-selected'));
          if (a.classList.contains('dp-day')) a.classList.add('is-selected');
        } catch (err) { /* silent */ }

        // navega via AJAX (soft)
        softNavigate(href);
      }
    });
  }

  // ---------- Autocomplete (busca contato) ----------
  function debounce(fn, wait) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
  }

  const doSearch = debounce(q => {
    if (!q) { autocompleteList.style.display = 'none'; return; }
    fetch(`/admin/chatlogs/search?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(list => {
        autocompleteList.innerHTML = '';
        if (!Array.isArray(list) || !list.length) { autocompleteList.style.display='none'; return; }
        list.slice(0, 8).forEach(item => {
          const li = document.createElement('li');
          li.tabIndex = 0;
          const digits = (item.phoneDigits || (item.phone || '')).toString().replace(/\D/g,'');
          const displayPhone = digits ? (digits.startsWith('55') ? digits : `55${digits}`) : '';
          li.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;">
            <span>${escapeHtml(item.name)}</span>
            <small style="opacity:.7">(${escapeHtml(displayPhone)})</small>
          </div>`;
          li.style.padding = '10px 12px';
          li.style.cursor  = 'pointer';
          li.addEventListener('click', () => {
            // URL-driven sem scroll
            softNavigate(`/admin/chatlogs/${item.id}`);
            // opcional: preencher o input
            searchInput.value = `${item.name} (${displayPhone})`;
          });
          li.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              softNavigate(`/admin/chatlogs/${item.id}`);
              searchInput.value = `${item.name} (${displayPhone})`;
            }
          });
          autocompleteList.appendChild(li);
        });
        autocompleteList.style.display = 'block';
      })
      .catch(() => { autocompleteList.style.display = 'none'; });
  }, 160);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      autocompleteList.style.display = 'none';
      doSearch(e.target.value.trim());
    });
  }
  document.addEventListener('mousedown', function (e) {
    if (!autocompleteList.contains(e.target) && e.target !== searchInput) {
      autocompleteList.style.display = 'none';
    }
  });
});


// ...imports e utilitários (iguais)...

/**
 * Constrói metadados do calendário a partir das mensagens de um contato.
 * Agora recebe idsParam para marcar o dia selecionado (.is-selected).
 */
function buildCalendarMeta(rows, monthParam, idsParam) {
  const dayToIds = new Map();   // 'YYYY-MM-DD' -> [ids]
  const monthSet = new Set();   // 'YYYY-MM'
  let latestDate = null;

  rows.forEach(r => {
    const d = new Date(r.time);
    const keyDay   = `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
    const keyMonth = `${d.getFullYear()}-${z(d.getMonth()+1)}`;
    if (!dayToIds.has(keyDay)) dayToIds.set(keyDay, []);
    dayToIds.get(keyDay).push(r.id);
    monthSet.add(keyMonth);
    if (!latestDate || d > latestDate) latestDate = d;
  });

  const monthsDesc = Array.from(monthSet).sort().reverse();
  if (!monthsDesc.length) return { hasData:false };

  const chosen = (monthParam && monthsDesc.includes(monthParam)) ? monthParam : monthsDesc[0];
  const [yy, mm] = chosen.split('-').map(Number);
  const y = yy, mIdx = mm - 1;

  const firstWeekday = new Date(y, mIdx, 1).getDay();
  const daysInMonth  = new Date(y, mIdx + 1, 0).getDate();

  const idsParamNormalized = String(idsParam || '').trim();

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${y}-${z(mIdx+1)}-${z(d)}`;
    const ids = dayToIds.get(key) || [];
    const idsStr = ids.join(',');
    const active = ids.length > 0;
    const selected = active && idsParamNormalized && (idsStr === idsParamNormalized);
    days.push({ day:d, active, ids, selected });
  }

  const idx     = monthsDesc.indexOf(chosen);
  const hasPrev = (idx < monthsDesc.length - 1);
  const hasNext = (idx > 0);
  const prevMonth = hasPrev ? monthsDesc[idx+1] : null;
  const nextMonth = hasNext ? monthsDesc[idx-1] : null;

  return {
    hasData:true,
    chosen,
    label: `${MESES[mIdx]} ${y}`,
    year: y,
    monthIndex: mIdx,
    firstWeekday,
    daysInMonth,
    days,
    hasPrev, prevMonth,
    hasNext, nextMonth
  };
}

// --- NOVOS HELPERS: extrair ids da URL e marcar o dia selecionado ---
function extractIdsFromUrl(url) {
  if (!url) return '';
  try {
    // remove query/hash
    const clean = url.split(/[?#]/)[0];
    const parts = clean.split('/').filter(Boolean); // ["admin","chatlogs",":userid", "ids"]
    const idx = parts.indexOf('chatlogs');
    if (idx === -1) return '';
    // ids podem estar em parts[idx+2]
    return parts[idx + 2] || '';
  } catch (e) {
    return '';
  }
}

function setSelectedDayInDatepicker(idsParam) {
  const grid = document.querySelector('.date-picker__grid');
  if (!grid) return;
  // remove seleção atual
  grid.querySelectorAll('.dp-day.is-selected').forEach(el => el.classList.remove('is-selected'));
  if (!idsParam) return;
  // procura um elemento ativo cujo href contenha os ids exatos (ou a substring)
  const items = grid.querySelectorAll('.dp-day');
  for (const el of items) {
    if (el.tagName.toLowerCase() === 'a') {
      const href = el.getAttribute('href') || '';
      // comparador simples: verificar que a URL contenha "/<idsParam>" (mais robusto que contains simples)
      if (href.includes(`/${idsParam}`) || href.endsWith(idsParam) || href.indexOf(encodeURIComponent(idsParam)) !== -1) {
        el.classList.add('is-selected');
        return;
      }
    } else {
      // elemento pode ser <button> (disabled) — ignora
    }
  }
}

// sincroniza seleção após softNavigate (chamada interna em softNavigate quando substitui datepicker)
// Para isso, patchamos softNavigate: após inserir newDP, notificar seleção.
// (como softNavigate já substitui os elementos acima, chamaremos setSelectedDayInDatepicker a partir daí)
// Atualiza softNavigate: (local dentro do arquivo) -> após history.pushState(...); adicione:
//    setSelectedDayInDatepicker(extractIdsFromUrl(url));
// Como estamos mostrando apenas alterações, abaixo está a localização e a chamada a ser adicionada.
// ...existing code...

// (local onde softNavigate faz history.pushState(null, '', url);) adicione a chamada:
// after replacing DP and pushing state:
// setSelectedDayInDatepicker(extractIdsFromUrl(url));

// Finalmente, ao carregar a página inicialmente, sincroniza seleção com a URL atual (caso SSR não tenha marcado)
document.addEventListener('DOMContentLoaded', function () {
  try {
    const currentIds = extractIdsFromUrl(location.pathname + location.search);
    setSelectedDayInDatepicker(currentIds);
  } catch (e) { /* silent */ }
});
