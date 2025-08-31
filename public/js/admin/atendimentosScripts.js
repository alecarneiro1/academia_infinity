document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('atendimentos-search-input');
  const list = document.getElementById('atendimentos-list');

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[ch]);
  }

  function attachMatriculaModalHandlers(context) {
    (context || document).querySelectorAll('.btn-matricula').forEach(btn => {
      btn.onclick = null;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const matriculaId = btn.getAttribute('data-matricula-id');
        if (!matriculaId) return;
        btn.disabled = true;
        btn.textContent = 'Carregando...';
        fetch(`/admin/matriculas/${matriculaId}?json=1`)
          .then(res => res.json())
          .then(data => {
            btn.disabled = false;
            btn.textContent = 'Matrícula';
            if (!data || !data.matricula) {
              window.openModal('<div style="padding:2rem;text-align:center;">Matrícula não encontrada.</div>');
              return;
            }
            const m = data.matricula;
            window.openModal(`
              <div style="max-width:420px">
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
            btn.textContent = 'Matrícula';
            window.openModal('<div style="padding:2rem;text-align:center;">Erro ao buscar matrícula.</div>');
          });
      });
    });
  }

  function renderAtendimentos(atendimentos, searchTerm, contactInfo) {
    // Fade out antigos
    list.querySelectorAll('.ticket-card').forEach(card => {
      card.classList.add('fade-out');
    });
    setTimeout(() => {
      list.innerHTML = '';
      if (contactInfo) {
        list.innerHTML += `<div style="margin: 1rem 0 1.5rem; color: var(--muted); font-size: 1.1rem;">
          Mostrando atendimentos para: <strong>${escapeHtml(contactInfo.contactname)} (${escapeHtml(contactInfo.contactphone)})</strong>
        </div>`;
      }
      if (!atendimentos.length) {
        let msg = '';
        if (searchTerm && searchTerm.length > 0) {
          msg = 'Nenhum atendimento encontrado para sua busca.';
        } else {
          msg = 'Busque um atendimento para visualizar os dados.';
        }
        list.innerHTML += `<div id="atendimentos-empty-msg" style="color:var(--muted);padding:2rem;text-align:center;">${msg}</div>`;
        return;
      }
      atendimentos.forEach(a => {
        const card = document.createElement('article');
        card.className = 'enroll-card ticket-card fade-in';
        card.innerHTML = `
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
            ${a.contato_phone ? `<a href="https://wa.me/${a.contato_phone.replace(/\D/g,'')}" target="_blank" class="btn btn--primary">Falar com o contato</a>` : ''}
            ${a.matriculaId ? `<a href="#" class="btn btn--outline-primary btn-matricula" data-matricula-id="${a.matriculaId}">Matrícula</a>` : ''}
            ${a.chatlogLink ? `<a href="${a.chatlogLink}" class="btn btn--outline-primary">Ver conversa</a>` : ''}
          </div>
        `;
        list.appendChild(card);
        setTimeout(() => card.classList.remove('fade-in'), 400);
      });
      attachMatriculaModalHandlers(list);
    }, 220);
  }

  // Busca AJAX
  function doSearch(q) {
    fetch(`/admin/atendimentos?search=${encodeURIComponent(q)}`, { headers: { accept: 'application/json' } })
      .then(res => res.json())
      .then(data => renderAtendimentos(data.atendimentos || [], q, data.contactInfo))
      .catch(() => renderAtendimentos([], q));
  }

  // Debounce
  let debounceT;
  function debounceSearch(q) {
    clearTimeout(debounceT);
    debounceT = setTimeout(() => doSearch(q), 180);
  }

  if (input && list) {
    input.addEventListener('input', function () {
      const q = input.value.trim();
      if (!q) {
        window.location.href = '/admin/atendimentos';
      } else {
        debounceSearch(q);
      }
    });
    // Enter no input não faz nada (busca é instantânea)
  }

  // Atacha handlers nos cards SSR ao carregar
  attachMatriculaModalHandlers(list);
});
