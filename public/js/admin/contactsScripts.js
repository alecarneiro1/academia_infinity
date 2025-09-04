document.addEventListener('DOMContentLoaded', function () {
  const form    = document.getElementById('contacts-search-form');
  const input   = document.getElementById('contacts-search-input');
  const userList= document.getElementById('user-list');

  // --- State ---
  const state = {
    q: '',
    offset: 0,
    limitFirst: 9,
    limitNext: 3,
    busy: false,
    hasMore: true,
    io: null,
    sentinel: null,
  };

  // --- Utils ---
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[ch]);
  }

  function showEmpty(msg) {
    userList.innerHTML = `<div id="contacts-empty-msg" style="color:var(--muted);padding:2rem;text-align:center;">${msg}</div>`;
  }

  function makeCard(c) {
    const card = document.createElement('article');
    card.className = 'enroll-card user-card';
    card.innerHTML = `
      <h4 class="user-card__name">${escapeHtml(c.contactname)}</h4>
      <p class="user-card__phone"><strong>WhatsApp:</strong> ${escapeHtml(c.contactphone || '')}</p>
      <div class="user-actions">
        <a href="https://wa.me/${escapeHtml(c.contactphone || '')}" target="_blank" class="btn btn--primary">Falar com contato</a>
        ${c.matriculaId ? `<a href="#" class="btn btn--outline-primary btn-matricula" data-matricula-id="${c.matriculaId}">Matrícula</a>` : ''}
        ${(c.atendimentoIds && c.atendimentoIds.length) ? `<a href="/admin/atendimentos/${c.id}" class="btn btn--outline-primary">Atendimentos</a>` : ''}
      </div>
    `;
    return card;
  }

  function attachMatriculaModalHandlers(context) {
    (context || document).querySelectorAll('.btn-matricula').forEach(btn => {
      btn.onclick = null;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const matriculaId = btn.getAttribute('data-matricula-id');
        if (!matriculaId) return;
        fetch(`/admin/matriculas/${encodeURIComponent(matriculaId)}?json=1`)
          .then(res => res.json())
          .then(data => {
            if (!data || !data.matricula) {
              window.openModal('<div style="padding:2rem;text-align:center;">Matrícula não encontrada.</div>');
              return;
            }
            const m = data.matricula;
            window.openModal(`
              <div style="max-width:420px">
                <h3 style="margin:0 0 1rem 0;">${escapeHtml(m.nome_completo || '')}</h3>
                <div style="font-size:15px;line-height:1.7;">
                  <strong>Plano:</strong> ${escapeHtml(m.plano || '-')}<br>
                  <strong>WhatsApp:</strong> ${escapeHtml(m.whatsapp || '-')}<br>
                  <strong>Data de nascimento:</strong> ${escapeHtml(m.data_nascimento || '-')}<br>
                  <strong>Endereço:</strong> ${escapeHtml(m.endereco || '-')}<br>
                  <strong>CEP:</strong> ${escapeHtml(m.cep || '-')}<br>
                  <strong>CPF:</strong> ${escapeHtml(m.cpf || '-')}<br>
                  <strong>Objetivo:</strong> ${escapeHtml(m.objetivo || '-')}<br>
                  <strong>Origem:</strong> ${escapeHtml(m.origem || '-')}<br>
                  <strong>Data de cadastro:</strong> ${m.submitted_at ? new Date(m.submitted_at).toLocaleDateString('pt-BR') : '-'}
                </div>
              </div>
            `);
          })
          .catch(() => {
            window.openModal('<div style="padding:2rem;text-align:center;">Erro ao buscar matrícula.</div>');
          });
      });
    });
  }

  // --- Render append + sentinel management ---
  function appendContacts(contacts) {
    // remove mensagem vazia
    const empty = document.getElementById('contacts-empty-msg');
    if (empty) empty.remove();

    // garantir sentinel no fim da lista
    ensureSentinel();

    contacts.forEach(c => {
      const card = makeCard(c);
      card.classList.add('fade-in');
      userList.insertBefore(card, state.sentinel);
      setTimeout(() => card.classList.remove('fade-in'), 300);
    });

    // reatachar handlers nos novos cards
    attachMatriculaModalHandlers(userList);
  }

  function ensureSentinel() {
    if (!state.sentinel) {
      state.sentinel = document.createElement('div');
      state.sentinel.id = 'infinite-sentinel';
      state.sentinel.style.height = '1px';
      state.sentinel.style.opacity = '0';
      userList.appendChild(state.sentinel);
    } else if (state.sentinel.parentNode !== userList) {
      userList.appendChild(state.sentinel);
    }
    if (!state.io) {
      state.io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            loadMore();
          }
        });
      }, { rootMargin: '300px' });
      state.io.observe(state.sentinel);
    }
  }

  // --- Fetch ---
  async function fetchBatch({ q, offset, limit }) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (typeof offset === 'number') params.set('offset', String(offset));
    if (typeof limit  === 'number') params.set('limit',  String(limit));
    const res = await fetch(`/admin/contatos/search?${params.toString()}`);
    if (!res.ok) throw new Error('fetch_failed');
    return res.json();
  }

  // --- Loaders ---
  async function resetAndLoad() {
    // reset state
    state.offset = 0;
    state.hasMore = true;

    userList.innerHTML = `<div id="contacts-empty-msg" style="color:var(--muted);padding:2rem;text-align:center;">Carregando contatos…</div>`;

    try {
      const data = await fetchBatch({ q: state.q, offset: 0, limit: state.limitFirst });
      const items = Array.isArray(data.contacts) ? data.contacts : [];
      if (!items.length) {
        showEmpty(state.q ? 'Nenhum contato encontrado para sua busca.' : 'Nenhum contato cadastrado.');
        state.hasMore = false;
        return;
      }
      appendContacts(items);
      state.offset = data.nextOffset ?? items.length;
      state.hasMore = !!data.hasMore;
    } catch (e) {
      showEmpty('Erro ao carregar contatos.');
      state.hasMore = false;
    }
  }

  async function loadMore() {
    if (!state.hasMore || state.busy) return;
    state.busy = true;

    // mini loader no sentinel
    state.sentinel.textContent = 'Carregando...';
    state.sentinel.style.opacity = '0.5';

    try {
      const data = await fetchBatch({ q: state.q, offset: state.offset, limit: state.limitNext });
      const items = Array.isArray(data.contacts) ? data.contacts : [];
      if (items.length) {
        appendContacts(items);
        state.offset = data.nextOffset ?? (state.offset + items.length);
        state.hasMore = !!data.hasMore;
      } else {
        state.hasMore = false;
      }
    } catch (e) {
      // opcional: mensagem de erro discreta
    } finally {
      state.sentinel.textContent = '';
      state.sentinel.style.opacity = '0';
      state.busy = false;
    }
  }

  // --- Busca com debounce ---
  let debounceT;
  function debounceSearch(q) {
    clearTimeout(debounceT);
    debounceT = setTimeout(() => {
      state.q = q.trim();
      resetAndLoad();
    }, 220);
  }

  if (input && form && userList) {
    input.addEventListener('input', function () {
      const q = input.value;
      debounceSearch(q);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      debounceSearch(input.value);
    });
  }

  // Inicial — 9 itens
  resetAndLoad();
});