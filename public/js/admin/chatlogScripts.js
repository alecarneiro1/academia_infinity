// Autocomplete de contatos
const input = document.getElementById('chatlog-contact-input');
const dropdown = document.getElementById('chatlog-dropdown');
const hiddenId = document.getElementById('chatlog-contact-id');
if (input && dropdown) {
  input.addEventListener('input', function () {
    const val = input.value.trim();
    hiddenId.value = '';
    if (!val) { dropdown.style.display = 'none'; return; }
    fetch(`/admin/chatlogs/search?q=${encodeURIComponent(val)}`)
      .then(res => res.json())
      .then(data => {
        if (data.length) {
          dropdown.innerHTML = data.map(c =>
            `<div class="chatlog-dropdown-item" data-id="${c.id}" data-name="${c.name}">${c.name}</div>`
          ).join('');
          dropdown.style.display = 'block';
        } else {
          dropdown.innerHTML = '';
          dropdown.style.display = 'none';
        }
      });
  });
  dropdown.addEventListener('mousedown', function (e) {
    if (e.target.classList.contains('chatlog-dropdown-item')) {
      input.value = e.target.dataset.name;
      hiddenId.value = e.target.dataset.id;
      dropdown.style.display = 'none';
    }
  });
  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target) && e.target !== input) {
      dropdown.style.display = 'none';
    }
  });
  // Ao enviar, redireciona para rota correta
  document.getElementById('chatlog-search-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!hiddenId.value) return;
    window.location.href = `/admin/chatlogs/${hiddenId.value}`;
  });
}

// Ir para última mensagem
document.addEventListener('DOMContentLoaded', function () {
  var btnGoLast = document.getElementById('btn-go-last-msg');
  var lastMsg = document.getElementById('last-msg');
  if (btnGoLast && lastMsg) {
    btnGoLast.addEventListener('click', function () {
      lastMsg.scrollIntoView({ behavior: 'smooth' });
    });
  }
});
