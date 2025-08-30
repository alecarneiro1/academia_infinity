// ========== Modal reutilizável ==========
// Para abrir: window.openModal(htmlOuElemento)
// Para fechar: window.closeModal()
// O conteúdo pode ser qualquer HTML ou elemento DOM

function createModalBase() {
  let modal = document.getElementById('global-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'global-modal';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.display = 'none';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.background = 'rgba(0,0,0,0.55)';
  modal.style.zIndex = '9999';
  modal.innerHTML = `
    <div class="modal__dialog" style="background: var(--surface,#171a21); color: var(--text,#e8eaed); border-radius: 18px; min-width:320px; max-width:96vw; min-height:80px; box-shadow: 0 8px 32px rgba(0,0,0,.35); position:relative; padding:32px 24px 24px 24px;">
      <button class="modal__close" aria-label="Fechar" style="position:absolute; top:14px; right:14px; background:var(--primary,#CF1742); color:#fff; border:none; border-radius:50%; width:36px; height:36px; font-size:1.3rem; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:2;">&times;</button>
      <div class="modal__content"></div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

window.openModal = function(content) {
  const modal = createModalBase();
  const contentDiv = modal.querySelector('.modal__content');
  // Limpa conteúdo anterior
  contentDiv.innerHTML = '';
  if (typeof content === 'string') {
    contentDiv.innerHTML = content;
  } else if (content instanceof Node) {
    contentDiv.appendChild(content);
  }
  modal.style.display = 'flex';
  setTimeout(() => { modal.classList.add('is-open'); }, 10);
  // Fecha ao clicar no X
  modal.querySelector('.modal__close').onclick = window.closeModal;
  // Fecha ao clicar fora do dialog
  modal.onclick = function(e) {
    if (e.target === modal) window.closeModal();
  };
  // Fecha com ESC
  document.addEventListener('keydown', escListener);
};

window.closeModal = function() {
  const modal = document.getElementById('global-modal');
  if (modal) {
    modal.classList.remove('is-open');
    setTimeout(() => { modal.style.display = 'none'; }, 180);
    document.removeEventListener('keydown', escListener);
  }
};

function escListener(e) {
  if (e.key === 'Escape') window.closeModal();
}
// Script para animar a sidebar ao abrir/fechar o menu hamburguer
// Requer: <input id="nav-toggle"> e <aside class="sidebar">

document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.getElementById('nav-toggle');
  const sidebar = document.querySelector('.sidebar');

  if (!navToggle || !sidebar) return;

  // Remove qualquer transição inline antiga
  sidebar.style.transition = '';

  // Estado inicial: escondida à esquerda
  sidebar.style.transform = 'translateX(-100%)';


  navToggle.addEventListener('change', function() {
    if (navToggle.checked) {
      // Abrir: anima da esquerda para a direita
      sidebar.style.transition = 'transform 0.35s';
      sidebar.style.transform = 'translateX(0)';
    } else {
      // Fechar: anima para a esquerda
      sidebar.style.transition = 'transform 0.35s';
      sidebar.style.transform = 'translateX(-100%)';
    }
  });

  // Garante que ao recarregar, o menu está fechado
  navToggle.checked = false;
  sidebar.style.transform = 'translateX(-100%)';
});
