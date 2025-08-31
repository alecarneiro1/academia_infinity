document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contacts-search-form');
  const input = document.getElementById('contacts-search-input');
  const userList = document.getElementById('user-list');

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[ch]);
  }

  function renderContacts(contacts, searchTerm) {
    // Fade out antigos
    userList.querySelectorAll('.user-card').forEach(card => {
      card.classList.add('fade-out');
    });
    setTimeout(() => {
      userList.innerHTML = '';
      if (!contacts.length) {
        let msg = '';
        if (searchTerm && searchTerm.length > 0) {
          msg = 'Nenhum contato encontrado para sua busca.';
        } else {
          msg = 'Busque um contato para visualizar os dados.';
        }
        userList.innerHTML = `<div id="contacts-empty-msg" style="color:var(--muted);padding:2rem;text-align:center;">${msg}</div>`;
        return;
      }
      contacts.forEach(c => {
        const card = document.createElement('article');
        card.className = 'enroll-card user-card fade-in';
        card.innerHTML = `
          <h4 class="user-card__name">${escapeHtml(c.contactname)}</h4>
          <p class="user-card__phone"><strong>WhatsApp:</strong> ${escapeHtml(c.contactphone || '')}</p>
          <div class="user-actions">
            <a href="#" class="btn btn--primary">Falar com contato</a>
            ${c.matriculaId ? `<a href="#" class="btn btn--outline-primary btn-matricula" data-matricula-id="${c.matriculaId}">Matrícula</a>` : ''}
            ${(c.atendimentoIds && c.atendimentoIds.length) ? `<a href="/admin/atendimentos?contact=${c.id}" class="btn btn--outline-primary">Atendimentos</a>` : ''}
          </div>
        `;
        userList.appendChild(card);
        setTimeout(() => card.classList.remove('fade-in'), 400);
      });

      // Handler para abrir modal da matrícula
      userList.querySelectorAll('.btn-matricula').forEach(btn => {
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
    }, 220);
  }

  // Busca AJAX
  function doSearch(q) {
    fetch(`/admin/contatos/search?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(data => renderContacts(data.contacts || [], q))
      .catch(() => renderContacts([], q));
  }

  // Debounce
  let debounceT;
  function debounceSearch(q) {
    clearTimeout(debounceT);
    debounceT = setTimeout(() => doSearch(q), 180);
  }

  if (input && form && userList) {
    input.addEventListener('input', function () {
      const q = input.value.trim();
      if (!q) {
        // Se vazio, recarrega a página para SSR mostrar todos os contatos
        window.location.reload();
      } else {
        debounceSearch(q);
      }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const q = input.value.trim();
      if (q) debounceSearch(q);
    });
  }
});