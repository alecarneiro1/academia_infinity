// JS para agenteView

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.agente-form').forEach(function(form) {
    form.addEventListener('submit', function(ev) {
      ev.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Salvando...';
      fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams(new FormData(form))
      })
      .then(res => {
        btn.disabled = false;
        btn.textContent = 'Salvar';
        if (res.ok) {
          window.openModal(`
            <div style="text-align:center;max-width:320px;">
              <h3 style="margin-bottom:1rem;">Atualizado com sucesso!</h3>
              <button class="btn btn--primary" onclick="window.closeModal()">Fechar</button>
            </div>
          `);
        } else {
          return res.text().then(msg => { throw new Error(msg); });
        }
      })
      .catch(err => {
        btn.disabled = false;
        btn.textContent = 'Salvar';
        window.openModal(`
          <div style="text-align:center;max-width:320px;">
            <h3 style="margin-bottom:1rem;color:#e11d48;">Erro ao atualizar</h3>
            <div style="color:#e11d48;font-size:1rem;margin-bottom:1rem;">${err.message}</div>
            <button class="btn btn--primary" onclick="window.closeModal()">Fechar</button>
          </div>
        `);
      });
    });
  });
});
