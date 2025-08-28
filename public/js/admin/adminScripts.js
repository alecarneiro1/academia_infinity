// Add your dashboard-specific JavaScript here

document.addEventListener('DOMContentLoaded', function () {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');

  function openSidebar() {
    sidebar.classList.add('is-open');
    backdrop.style.display = 'block';
  }
  function closeSidebar() {
    sidebar.classList.remove('is-open');
    backdrop.style.display = 'none';
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      if (sidebar.classList.contains('is-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  // Fecha sidebar ao redimensionar para desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 960) {
      closeSidebar();
    }
  });
});
