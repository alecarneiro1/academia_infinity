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
            ${c.matriculaId ? `<a href="/admin/matriculas/${c.matriculaId}" class="btn btn--outline-primary">Matrícula</a>` : ''}
            ${(c.atendimentoIds && c.atendimentoIds.length) ? `<a href="/admin/atendimentos?contact=${c.id}" class="btn btn--outline-primary">Atendimentos</a>` : ''}
          </div>
        `;
        userList.appendChild(card);
        setTimeout(() => card.classList.remove('fade-in'), 400);
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