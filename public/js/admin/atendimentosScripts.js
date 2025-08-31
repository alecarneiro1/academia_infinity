document.addEventListener('DOMContentLoaded', () => {
  const input   = document.getElementById('atendimentos-search-input');
  const list    = document.getElementById('atendimentos-list');
  const ctx     = document.getElementById('at-context');
  const moreBox = document.getElementById('atendimentos-more');
  const btnMore = document.getElementById('btn-load-more');
  const acList  = document.getElementById('at-autocomplete-list');

  // ---------- URL helpers ----------
  const getParams = () => new URLSearchParams(location.search);
  function setParams(obj, {push=true} = {}) {
    const p = getParams();
    Object.entries(obj).forEach(([k,v]) => {
      if (v === null || v === undefined || v === '') p.delete(k);
      else p.set(k, v);
    });
    const url = `${location.pathname}?${p.toString()}`;
    if (push) history.pushState(null, '', url);
    return p;
  }
  function state() {
    const p = getParams();
    return {
      user: p.get('user') || '',
      ids:  p.get('ids')  || '',
      page: Math.max(1, parseInt(p.get('page') || '1', 10))
    };
  }

  // ---------- utils ----------
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[ch]);
  }
  function phoneDigits55(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.startsWith('55') ? digits : (digits ? `55${digits}` : '');
  }

  // ---------- render ----------
  function renderContext(contactInfo) {
    if (contactInfo && contactInfo.contactname) {
      const phone = contactInfo.contactphoneDigits || phoneDigits55(contactInfo.contactphone);
      ctx.innerHTML = `Mostrando atendimentos para: <strong>${escapeHtml(contactInfo.contactname)} (${escapeHtml(phone)})</strong>`;
      ctx.style.display = 'block';
    } else {
      ctx.style.display = 'none';
      ctx.innerHTML = '';
    }
  }

  function cardHTML(a) {
    return `
      <article class="enroll-card ticket-card fade-in">
        <h4 class="ticket-card__title">${escapeHtml(a.subject)}</h4>
        <dl class="kv">
          <dt>Contato:</dt><dd>${escapeHtml(a.contato)}</dd>
          <dt>Data:</dt><dd>${a.date ? new Date(a.date).toLocaleDateString('pt-BR') : '-'}</dd>
          <dt>Início:</dt><dd>${escapeHtml(a.start_time || '-')}</dd>
          <dt>Fim:</dt><dd>${escapeHtml(a.end_time || '-')}</dd>
          <dt>Duração:</dt><dd>${a.duration_minutes ? a.duration_minutes + ' min' : '-'}</dd>
        </dl>
        <div class="summary">
          <h5>Resumo da conversa:</h5>
          <p>${escapeHtml(a.summary || '-')}</p>
        </div>
        <div class="btn-row">
          ${a.contato_phoneDigits ? `<a href="https://wa.me/${a.contato_phoneDigits}" target="_blank" class="btn btn--primary">Falar com o contato</a>` : ''}
          ${a.matriculaId ? `<a href="#" class="btn btn--outline-primary btn-matricula" data-matricula-id="${a.matriculaId}">Matrícula</a>` : ''}
          ${a.chatlogLink ? `<a href="${a.chatlogLink}" class="btn btn--outline-primary">Ver conversa</a>` : ''}
        </div>
      </article>
    `;
  }

  function attachMatriculaModalHandlers(context) {
    (context || document).querySelectorAll('.btn-matricula').forEach(btn => {
      btn.onclick = null;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const matriculaId = btn.getAttribute('data-matricula-id');
        if (!matriculaId) return;
        btn.disabled = true;
        const prevText = btn.textContent;
        btn.textContent = 'Carregando...';
        fetch(`/admin/matriculas/${matriculaId}?json=1`)
          .then(res => res.json())
          .then(data => {
            btn.disabled = false;
            btn.textContent = prevText;
            if (!data || !data.matricula) {
              window.openModal('<div style="padding:2rem;text-align:center;">Matrícula não encontrada.</div>');
              return;
            }
            const m = data.matricula;
            window.openModal(`
              <div style="max-width:460px">
                <h3 style="margin:0 0 1rem 0;">Matrícula de ${escapeHtml(m.nome_completo || '')}</h3>
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
                <div style="margin-top:1.5rem;text-align:right;">
                  <button class="btn btn--primary" onclick="window.closeModal()">Fechar</button>
                </div>
              </div>
            `);
          })
          .catch(() => {
            btn.disabled = false;
            btn.textContent = prevText;
            window.openModal('<div style="padding:2rem;text-align:center;">Erro ao buscar matrícula.</div>');
          });
      });
    });
  }

  // ---------- carregar dados ----------
  let loading = false;
  async function loadAtendimentos({ append=false } = {}) {
    if (loading) return;
    loading = true;

    const { user, ids, page } = state();
    const url = `/admin/atendimentos/api/list?${[
      user ? `user=${encodeURIComponent(user)}` : '',
      ids  ? `ids=${encodeURIComponent(ids)}`   : '',
      `page=${page}`
    ].filter(Boolean).join('&')}`;

    const res = await fetch(url);
    const data = await res.json().catch(()=>({ ok:false }));

    if (!data.ok) {
      if (!append) list.innerHTML = `<div style="color:var(--muted);padding:2rem;text-align:center;">Erro ao carregar atendimentos.</div>`;
      loading = false;
      return;
    }

    renderContext(data.contactInfo);

    if (!append) {
      list.innerHTML = '';
      window.scrollTo({ top: 0 });
    }

    if (!data.items || !data.items.length) {
      if (!append) {
        list.innerHTML = `<div id="atendimentos-empty-msg" style="color:var(--muted);padding:2rem;text-align:center;">
          ${user || ids ? 'Nenhum atendimento encontrado.' : 'Busque um contato para visualizar os atendimentos.'}
        </div>`;
      }
      moreBox.style.display = 'none';
      loading = false;
      return;
    }

    const frag = document.createDocumentFragment();
    data.items.forEach(item => {
      const div = document.createElement('div');
      div.innerHTML = cardHTML(item);
      const card = div.firstElementChild;
      frag.appendChild(card);
      setTimeout(() => card.classList.remove('fade-in'), 350);
    });
    list.appendChild(frag);

    attachMatriculaModalHandlers(list);

    moreBox.style.display = data.hasMore ? 'block' : 'none';
    loading = false;
  }

  // ---------- paginação ----------
  btnMore?.addEventListener('click', () => {
    const p = state().page + 1;
    setParams({ page: p });
    loadAtendimentos({ append: true });
  });

  // ---------- autocomplete (contatos) ----------
  function debounce(fn, wait){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); }; }

  const doSearch = debounce(q => {
    if (!q) {
      acList.style.display = 'none';
      return;
    }
    fetch(`/admin/atendimentos/search?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(listItems => {
        acList.innerHTML = '';
        if (!Array.isArray(listItems) || !listItems.length) { acList.style.display = 'none'; return; }

        listItems.slice(0,5).forEach(item => {
          const li = document.createElement('li');
          li.tabIndex = 0;
          const digits = item.phoneDigits || phoneDigits55(item.phone);
          li.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;">
            <span>${escapeHtml(item.name)}</span>
            <small style="opacity:.7">(${escapeHtml(digits)})</small>
          </div>`;
          li.style.padding = '10px 12px';
          li.style.cursor  = 'pointer';
          li.addEventListener('click', () => {
            // define o contato selecionado na URL e reseta ids/page
            setParams({ user: item.id, ids: '', page: 1 });
            input.value = `${item.name} (${digits})`;
            acList.style.display = 'none';
            loadAtendimentos({ append: false });
          });
          li.addEventListener('keydown', (e) => { if (e.key === 'Enter') li.click(); });
          acList.appendChild(li);
        });
        acList.style.display = 'block';
      })
      .catch(() => { acList.style.display = 'none'; });
  }, 160);

  if (input) {
    input.addEventListener('input', (e) => {
      acList.style.display = 'none';
      doSearch(e.target.value.trim());
    });
  }
  document.addEventListener('mousedown', (e) => {
    if (!acList.contains(e.target) && e.target !== input) {
      acList.style.display = 'none';
    }
  });

  // ---------- popstate ----------
  window.addEventListener('popstate', () => {
    // em back/forward, recarrega a lista de acordo com a URL
    loadAtendimentos({ append: false });
  });

  // ---------- boot ----------
  // mantém o que vier na URL (user/ids/page)
  loadAtendimentos({ append: false });
});
