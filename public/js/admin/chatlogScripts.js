document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('contact-search');
  const autocompleteList = document.getElementById('autocomplete-list');
  const datepickerWrap = document.getElementById('datepicker-wrap');
  const datepickerGrid = document.getElementById('datepicker-grid');
  const monthTitle = document.getElementById('month-title');
  const pickerContext = document.getElementById('picker-context');
  const selectedContactName = document.getElementById('selected-contact-name');
  const btnAllMessages = document.getElementById('btn-all-messages');
  const chatMessages = document.getElementById('chat-messages');
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');

  let selectedContact = null;
  let daysByDate = {}; // {'YYYY-MM-DD': [ids]}
  let monthsAvailable = []; // [{year, month, label}]
  let currentMonthIndex = 0;
  let allMessagesIds = [];

  // debounce helper
  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // --- Autocomplete ---
  const doSearch = debounce(q => {
    if (!q) {
      autocompleteList.style.display = 'none';
      return;
    }
    fetch(`/admin/chatlogs/search?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(list => {
        autocompleteList.innerHTML = '';
        if (!Array.isArray(list) || list.length === 0) {
          autocompleteList.style.display = 'none';
          return;
        }
        // mostra até 5 resultados
        list.slice(0, 5).forEach(item => {
          const li = document.createElement('li');
          li.tabIndex = 0;
          const digits = (item.phoneDigits || (item.phone || '')).toString().replace(/\D/g, '');
          const displayPhone = digits ? (digits.startsWith('55') ? digits : `55${digits}`) : '';
          li.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;"><span>${escapeHtml(item.name)}</span><small style="opacity:.7">(${escapeHtml(displayPhone)})</small></div>`;
          li.style.padding = '10px 12px';
          li.style.cursor = 'pointer';
          li.addEventListener('click', () => selectContact(item));
          li.addEventListener('keydown', (e) => { if (e.key === 'Enter') selectContact(item); });
          autocompleteList.appendChild(li);
        });
        autocompleteList.style.display = 'block';
      })
      .catch(() => { autocompleteList.style.display = 'none'; });
  }, 160);

  searchInput.addEventListener('input', (e) => {
    autocompleteList.style.display = 'none';
    doSearch(e.target.value.trim());
  });

  document.addEventListener('mousedown', function (e) {
    if (!autocompleteList.contains(e.target) && e.target !== searchInput) {
      autocompleteList.style.display = 'none';
    }
  });

  function selectContact(item) {
    selectedContact = item;
    searchInput.value = `${item.name} (${item.phoneDigits || item.phone || ''})`;
    autocompleteList.style.display = 'none';
    loadContactDays(item.id);
    history.replaceState({}, '', `/admin/chatlogs/${item.id}`);
  }

  // --- Helpers ---
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
  }

  function groupByMonth(daysArray) {
    // daysArray: [{date:'YYYY-MM-DD', ids: [...]}, ...]
    const map = new Map();
    daysArray.forEach(d => {
      const [y, m] = d.date.split('-');
      const key = `${y}-${m}`;
      if (!map.has(key)) map.set(key, { year: Number(y), month: Number(m) - 1, days: [] });
      map.get(key).days.push(d);
    });
    // convert to sorted array by year-month desc
    const arr = Array.from(map.values()).sort((a,b) => (b.year - a.year) || (b.month - a.month));
    // add readable label
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return arr.map(m => ({ year: m.year, month: m.month, label: `${monthNames[m.month]} ${m.year}`, days: m.days }));
  }

  // --- Load days metadata for contact ---
  function loadContactDays(contactId) {
    fetch(`/admin/chatlogs/${contactId}?meta=days`)
      .then(res => res.json())
      .then(data => {
        // data.days: [{date, ids}], data.allIds, data.year, data.month, data.monthLabel
        daysByDate = {};
        (data.days || []).forEach(d => { daysByDate[d.date] = d.ids; });
        allMessagesIds = data.allIds || [];
        // build months available
        monthsAvailable = groupByMonth(data.days || []);
        if (monthsAvailable.length === 0) {
          // mostra apenas "Nenhum dia disponível"
          renderEmptyDatepicker();
          return;
        }
        // selecionar o mês mais recente (index 0)
        currentMonthIndex = 0;
        renderMonth(currentMonthIndex);
        // show datepicker
        datepickerWrap.style.display = 'block';
        setTimeout(() => datepickerWrap.style.opacity = 1, 16);
        pickerContext.style.display = 'block';
        selectedContactName.textContent = selectedContact.name;
        btnAllMessages.style.display = allMessagesIds.length ? 'inline-block' : 'none';
        btnAllMessages.onclick = () => {
          if (!allMessagesIds.length) return;
          // remove seleção visual ao pedir "Todas"
          datepickerGrid.querySelectorAll('.dp-day.is-selected').forEach(x => x.classList.remove('is-selected'));
          loadMessagesByIds(selectedContact.id, allMessagesIds, selectedContact.name, true);
          history.replaceState({}, '', `/admin/chatlogs/${selectedContact.id}/all`);
        };

        // --- APLICAR SELEÇÃO INICIAL (se a URL veio com ids) ---
        try {
          const root = document.getElementById('mensagens');
          const initialIdsParam = root?.dataset?.idsParam || '';
          if (initialIdsParam) {
            const targetIds = initialIdsParam.split(',').map(Number).filter(Boolean);
            if (targetIds.length) {
              // procurar data que contenha todos (ou ao menos algum) desses ids
              let matchedDate = null;
              for (const dateKey in daysByDate) {
                const ids = daysByDate[dateKey] || [];
                const hasAll = targetIds.every(id => ids.includes(id));
                const hasAny = targetIds.some(id => ids.includes(id));
                if (hasAll) { matchedDate = dateKey; break; }
                if (hasAny && !matchedDate) matchedDate = dateKey;
              }
              if (matchedDate) {
                const [y, mm, dd] = matchedDate.split('-');
                const monthNum = Number(mm) - 1;
                const monthIdx = monthsAvailable.findIndex(m => m.year === Number(y) && m.month === monthNum);
                if (monthIdx >= 0) {
                  currentMonthIndex = monthIdx;
                  renderMonth(currentMonthIndex);
                  // marca visualmente o dia correspondente
                  setTimeout(() => {
                    datepickerGrid.querySelectorAll('.dp-day.is-selected').forEach(x => x.classList.remove('is-selected'));
                    const btn = Array.from(datepickerGrid.querySelectorAll('.dp-day')).find(b => b.textContent.trim() === String(Number(dd)));
                    if (btn) {
                      btn.classList.add('is-selected');
                      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 20);
                }
              }
            }
          }
        } catch (err) {
          console.error('Erro ao aplicar seleção inicial:', err);
        }
      })
      .catch(err => {
        console.error('Erro ao buscar dias:', err);
      });
  }

  function renderEmptyDatepicker() {
    monthTitle.textContent = 'Nenhum dia com mensagens';
    datepickerGrid.innerHTML = `<div style="padding:20px;color:var(--muted);text-align:center;">Nenhuma mensagem encontrada para este contato.</div>`;
    datepickerWrap.style.display = 'block';
    setTimeout(() => datepickerWrap.style.opacity = 1, 16);
  }

  function renderMonth(idx) {
    const m = monthsAvailable[idx];
    if (!m) return;
    monthTitle.textContent = m.label;
    // populate grid
    datepickerGrid.innerHTML = '';
    const firstDay = new Date(m.year, m.month, 1).getDay();
    const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();
    // Preenche blanks antes
    for (let i = 0; i < firstDay; i++) {
      const b = document.createElement('button');
      b.className = 'dp-day is-disabled';
      b.type = 'button';
      b.disabled = true;
      b.innerHTML = '&nbsp;';
      datepickerGrid.appendChild(b);
    }
    // Dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
      const yyyy = m.year;
      const mm = String(m.month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const btn = document.createElement('button');
      btn.className = 'dp-day';
      btn.type = 'button';
      btn.textContent = d;
      const ids = daysByDate[dateKey];
      if (Array.isArray(ids) && ids.length) {
        btn.classList.add('is-active');
        btn.addEventListener('click', function () {
          // atualiza seleção visual
          datepickerGrid.querySelectorAll('.dp-day.is-selected').forEach(x => x.classList.remove('is-selected'));
          this.classList.add('is-selected');
          loadMessagesByIds(selectedContact.id, ids, selectedContact.name, false, dateKey);
          history.replaceState({}, '', `/admin/chatlogs/${selectedContact.id}/${ids.join(',')}`);
        });
      } else {
        btn.classList.add('is-disabled');
        btn.disabled = true;
      }
      datepickerGrid.appendChild(btn);
    }

    // Corrige lógica prev/next
    prevBtn.disabled = (idx >= monthsAvailable.length - 1);
    nextBtn.disabled = (idx <= 0);
  }

  prevBtn.addEventListener('click', () => {
    if (currentMonthIndex < monthsAvailable.length - 1) {
      currentMonthIndex++;
      renderMonth(currentMonthIndex);
    }
  });
  nextBtn.addEventListener('click', () => {
    if (currentMonthIndex > 0) {
      currentMonthIndex--;
      renderMonth(currentMonthIndex);
    }
  });

  // --- Load messages by ids ---
  function loadMessagesByIds(contactId, ids, contactName, all = false, dayStr = '') {
    chatMessages.innerHTML = '<div style="text-align:center;padding:2rem;">Carregando...</div>';
    const idsParam = Array.isArray(ids) ? ids.join(',') : ids;
    fetch(`/admin/chatlogs/${contactId}/${idsParam}?json=1`)
      .then(res => res.json())
      .then(data => {
        renderMessages(data.messages || [], contactName, all, dayStr);
        // scroll to messages
        chatMessages.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(err => {
        console.error('Erro ao carregar mensagens:', err);
        chatMessages.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--muted);">Erro ao carregar mensagens.</div>';
      });
  }

  function renderMessages(messages, contactName, all, dayStr) {
    let html = '';
    if (all) {
      html += `<div class="chat__day">Todas as mensagens de <b>${escapeHtml(contactName)}</b></div>`;
    } else if (dayStr) {
      const [y, m, d] = dayStr.split('-');
      html += `<div class="chat__day">${d}/${m}/${y}</div>`;
    }
    if (!messages.length) {
      html += `<div style="text-align:center;color:var(--muted);padding:2rem;">Nenhuma mensagem encontrada.</div>`;
    }
    messages.forEach(msg => {
      if (msg.usermessage) {
        html += `<div class="msg msg--in"><p class="msg__text">${escapeHtml(msg.usermessage)}</p><span class="msg__time">${formatTime(msg.time)}</span></div>`;
      }
      if (msg.agentresponse) {
        html += `<div class="msg msg--out"><p class="msg__text">${escapeHtml(msg.agentresponse)}</p><span class="msg__time">${formatTime(msg.time)}</span></div>`;
      }
    });
    chatMessages.innerHTML = html;
  }

  function formatTime(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // Hidratação a partir do SSR (rota direta /admin/chatlogs/:userid[/ids])
  const rootMensagens = document.getElementById('mensagens');
  const initialUserId = rootMensagens?.dataset?.userId;
  const initialContactName = rootMensagens?.dataset?.contactName || '';
  const initialIdsParam = rootMensagens?.dataset?.idsParam || '';

  if (initialUserId) {
    selectedContact = { id: Number(initialUserId), name: initialContactName };
    // mostra nome no "Exibindo conversa com..."
    selectedContactName.textContent = initialContactName;
    // carrega metadados (dias disponíveis) para o datepicker
    loadContactDays(selectedContact.id);
    // Observação: se HTML já veio SSR (messages já renderizadas), não re-carregamos mensagens aqui.
  }
});
