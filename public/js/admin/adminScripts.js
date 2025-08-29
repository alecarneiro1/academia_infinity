// Add your dashboard-specific JavaScript here

// Sidebar toggle para todas as páginas do painel

function setupSidebarToggle() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');

  // Garante que sidebar e backdrop existem
  if (!sidebar || !backdrop) return;

  function openSidebar() {
    sidebar.classList.add('is-open');
    backdrop.style.display = 'block';
  }
  function closeSidebar() {
    sidebar.classList.remove('is-open');
    backdrop.style.display = 'none';
  }

  // Sempre remove e adiciona listeners para evitar múltiplos binds
  if (toggleBtn) {
    toggleBtn.onclick = function () {
      if (sidebar.classList.contains('is-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    };
  }

  backdrop.onclick = closeSidebar;

  // Fecha sidebar ao redimensionar para desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 960) {
      closeSidebar();
    }
  });

  // Fecha sidebar ao navegar (mobile SPA-like)
  document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', function () {
      if (window.innerWidth <= 960) {
        closeSidebar();
      }
    });
  });
}

// Sempre executa após DOM pronto, inclusive em navegadores antigos
window.addEventListener('DOMContentLoaded', setupSidebarToggle);

(function () {
  // Cria modal se não existir
  function ensureModal() {
    if (!document.getElementById('global-modal')) {
      const modalHtml = `
        <div id="global-modal-backdrop" style="display:none;position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.45);"></div>
        <div id="global-modal" style="display:none;position:fixed;z-index:9999;left:0;top:0;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;">
          <div id="global-modal-content" style="background:#151923;border-radius:14px;box-shadow:0 8px 32px #000a;padding:2rem;max-width:96vw;max-height:90vh;overflow:auto;position:relative;">
            <button id="global-modal-close" style="position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:1.8rem;color:#e11d48;cursor:pointer;">×</button>
            <div id="global-modal-body"></div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      // Fechar ao clicar no X ou no backdrop
      document.getElementById('global-modal-close').onclick = closeModal;
      document.getElementById('global-modal-backdrop').onclick = closeModal;
    }
  }

  function openModal(htmlOrElement) {
    ensureModal();
    const body = document.getElementById('global-modal-body');
    if (typeof htmlOrElement === 'string') {
      body.innerHTML = htmlOrElement;
    } else if (htmlOrElement instanceof Node) {
      body.innerHTML = '';
      body.appendChild(htmlOrElement);
    }
    document.getElementById('global-modal').style.display = 'flex';
    document.getElementById('global-modal-backdrop').style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('global-modal');
    const backdrop = document.getElementById('global-modal-backdrop');
    if (modal) modal.style.display = 'none';
    if (backdrop) backdrop.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Expor globalmente
  window.openModal = openModal;
  window.closeModal = closeModal;
})();
