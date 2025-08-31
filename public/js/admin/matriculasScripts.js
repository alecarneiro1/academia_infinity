document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('matriculas-search-input');
  const list = document.getElementById('matriculas-list');

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[ch]);
  }

  function attachModalHandlers(context) {
    (context || document).querySelectorAll('.btn-ver-matricula').forEach(btn => {
      // Evita múltiplos listeners
      btn.onclick = null;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        if (!id) return;
        btn.disabled = true;
        btn.textContent = 'Carregando...';
        fetch(`/admin/matriculas/${id}?json=1`)
          .then(res => res.json())
          .then(data => {
            btn.disabled = false;
            btn.textContent = 'Ver matrícula';
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
              </div>
            `);
          })
          .catch(() => {
            btn.disabled = false;
            btn.textContent = 'Ver matrícula';
            window.openModal('<div style="padding:2rem;text-align:center;">Erro ao buscar matrícula.</div>');
          });
      });
    });
  }

  function renderMatriculas(matriculas, searchTerm) {
    // Fade out antigos
    list.querySelectorAll('.enroll-card').forEach(card => {
      card.classList.add('fade-out');
    });
    setTimeout(() => {
      list.innerHTML = '';
      if (!matriculas.length) {
        let msg = '';
        if (searchTerm && searchTerm.length > 0) {
          msg = 'Nenhuma matrícula encontrada para sua busca.';
        } else {
          msg = 'Busque uma matrícula para visualizar os dados.';
        }
        list.innerHTML = `<div id="matriculas-empty-msg" style="color:var(--muted);padding:2rem;text-align:center;">${msg}</div>`;
        return;
      }
      matriculas.forEach(m => {
        const card = document.createElement('article');
        card.className = 'enroll-card fade-in';
        card.innerHTML = `
          <h4 class="enroll-card__name">${escapeHtml(m.nome_completo)}</h4>
          <p class="enroll-card__meta"><strong>Data de cadastro:</strong> ${m.submitted_at ? new Date(m.submitted_at).toLocaleDateString('pt-BR') : '-'}</p>
          <div class="enroll-card__footer">
            <a href="#" class="btn btn--primary btn-ver-matricula" data-id="${m.id}">Ver matrícula</a>
          </div>
        `;
        list.appendChild(card);
        setTimeout(() => card.classList.remove('fade-in'), 400);
      });
      // Handler para abrir modal da matrícula (para novos cards)
      attachModalHandlers(list);
    }, 220);
  }

  // Busca AJAX
  function doSearch(q) {
    fetch(`/admin/matriculas?search=${encodeURIComponent(q)}`, { headers: { accept: 'application/json' } })
      .then(res => res.json())
      .then(data => renderMatriculas(data.matriculas || [], q))
      .catch(() => renderMatriculas([], q));
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
        // Se vazio, recarrega a página para SSR mostrar todas as matrículas
        window.location.reload();
      } else {
        debounceSearch(q);
      }
    });
    // Enter no input não faz nada (busca é instantânea)
  }

  // --- NOVO: ao carregar a página, atacha handlers nos cards SSR ---
  attachModalHandlers(list);
});
