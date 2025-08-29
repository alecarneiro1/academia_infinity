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
