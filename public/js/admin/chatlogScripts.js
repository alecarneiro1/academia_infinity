document.addEventListener('DOMContentLoaded', () => {
  const searchInput       = document.getElementById('contact-search');
  const autocompleteList  = document.getElementById('autocomplete-list');
  const wrap              = document.getElementById('datepicker-wrap');
  const monthTitle        = document.getElementById('month-title');
  const grid              = document.getElementById('datepicker-grid');
  const btnPrev           = document.getElementById('prev-month');
  const btnNext           = document.getElementById('next-month');
  const pickerContext     = document.getElementById('picker-context');
  const selectedContactEl = document.getElementById('selected-contact-name');
  const chatMessages      = document.getElementById('chat-messages');

  // ------------- helpers URL -------------
  const getParams = () => new URLSearchParams(location.search);
  function setParams(obj, {push=true} = {}) {
    const p = getParams();
    Object.entries(obj).forEach(([k,v]) => {
      if (v === null || v === undefined || v === '') p.delete(k);
      else p.set(k, v);
    });
    const url = `${location.pathname}?${p.toString()}`;
    if (push) history.pushState(null, '', url);
    return p;
  }
  function parseState() {
    const p = getParams();
    return {
      user: p.get('user') || '',
      ids:  p.get('ids')  || '',
      month:p.get('month')|| ''
    };
  }
  const z = n => String(n).padStart(2,'0');

  // ------------- renderização -------------
  function renderMessages(items, contactName) {
    let html = '';
    if (contactName) {
      pickerContext.style.display = 'block';
      selectedContactEl.textContent = contactName;
    } else {
      pickerContext.style.display = 'none';
      selectedContactEl.textContent = '';
    }

    // --- Agrupamento por data ---
    if (!items.length) {
      html += `<div style="text-align:center;color:var(--muted);padding:2rem;">Nenhuma mensagem encontrada.</div>`;
      chatMessages.innerHTML = html;
      return;
    }

    let lastDay = '';
    items.forEach(m => {
      const d = new Date(m.time);
      const day = `${z(d.getDate())}/${z(d.getMonth()+1)}/${d.getFullYear()}`;
      if (day !== lastDay) {
        html += `<div class="chat__day">${day}</div>`;
        lastDay = day;
      }
      if (m.usermessage) {
        html += `<div class="msg msg--in">
          <p class="msg__text">${escapeHtml(m.usermessage)}</p>
          <span class="msg__time">${formatTime(m.time)}</span>
        </div>`;
      }
      if (m.agentresponse) {
        html += `<div class="msg msg--out">
          <p class="msg__text">${escapeHtml(m.agentresponse)}</p>
          <span class="msg__time">${formatTime(m.time)}</span>
        </div>`;
      }
    });
    chatMessages.innerHTML = html;
  }

  function renderCalendar(dp) {
    if (!dp || !dp.hasData) {
      wrap.style.display = 'none';
      wrap.style.opacity = 0;
      grid.innerHTML = '';
      return;
    }
    wrap.style.display = 'block';
    requestAnimationFrame(() => wrap.style.opacity = 1);

    monthTitle.textContent = dp.label;

    // prev/next
    btnPrev.disabled = !dp.hasPrev;
    btnNext.disabled = !dp.hasNext;

    // grid:
    grid.innerHTML = '';
    for (let i = 0; i < dp.firstWeekday; i++) {
      const b = document.createElement('button');
      b.className = 'dp-day is-disabled';
      b.type = 'button';
      b.disabled = true;
      b.innerHTML = '&nbsp;';
      grid.appendChild(b);
    }
    for (let d = 1; d <= dp.daysInMonth; d++) {
      const info = dp.days[d-1];
      const btn = document.createElement('button');
      btn.className = 'dp-day';
      btn.type = 'button';
      btn.textContent = d;

      if (info && info.active) {
        btn.classList.add('is-active');
        if (info.selected) btn.classList.add('is-selected');

        btn.addEventListener('click', () => {
          // Atualiza ids na URL e carrega mensagens
          setParams({ ids: info.ids.join(',') });
          loadMessages(); // mantém scroll
          // marca visualmente
          grid.querySelectorAll('.dp-day.is-selected').forEach(el => el.classList.remove('is-selected'));
          btn.classList.add('is-selected');
        });
      } else {
        btn.classList.add('is-disabled');
        btn.disabled = true;
      }
      grid.appendChild(btn);
    }
  }

  // ------------- carregamento AJAX -------------
  async function loadCalendar() {
    const { user, month, ids } = parseState();
    if (!user) {
      renderCalendar(null);
      renderMessages([], '');
      return;
    }
    const res = await fetch(`/admin/chatlogs/api/calendar?user=${encodeURIComponent(user)}${month ? `&month=${encodeURIComponent(month)}`:''}${ids?`&ids=${encodeURIComponent(ids)}`:''}`);
    const data = await res.json();
    if (!data.ok) return;

    if (data.contact) selectedContactEl.textContent = data.contact.name;

    renderCalendar(data.dp, ids);
  }

  async function loadMessages() {
    const keepY = window.scrollY;
    const { user, ids } = parseState();
    if (!user) { renderMessages([], ''); return; }
    const res = await fetch(`/admin/chatlogs/api/messages?user=${encodeURIComponent(user)}${ids?`&ids=${encodeURIComponent(ids)}`:''}`);
    const data = await res.json();
    if (!data.ok) return;
    renderMessages(data.items, data.contact ? data.contact.name : '', { all: !ids });
    window.scrollTo({ top: keepY });
  }

  // ------------- eventos UI -------------
  btnPrev?.addEventListener('click', () => {
    const { user } = parseState();
    if (!user) return;
    // vamos pedir o mês anterior com base no título atual (o backend nos devolve prev/next no JSON;
    // para simplificar, recarregamos o calendário e lemos dp.prevMonth/nextMonth não aqui, mas via click nos botões do calendário SSR.
    // Como aqui é todo JS, fazemos assim: pedimos o calendário atual, lemos dp.prevMonth e setamos.
    fetch(`/admin/chatlogs/api/calendar?user=${encodeURIComponent(parseState().user)}${parseState().month?`&month=${encodeURIComponent(parseState().month)}`:''}`)
      .then(r=>r.json()).then(j=>{
        if (j.ok && j.dp && j.dp.hasPrev && j.dp.prevMonth) {
          setParams({ month: j.dp.prevMonth });
          loadCalendar();
        }
      });
  });

  btnNext?.addEventListener('click', () => {
    const { user } = parseState();
    if (!user) return;
    fetch(`/admin/chatlogs/api/calendar?user=${encodeURIComponent(parseState().user)}${parseState().month?`&month=${encodeURIComponent(parseState().month)}`:''}`)
      .then(r=>r.json()).then(j=>{
        if (j.ok && j.dp && j.dp.hasNext && j.dp.nextMonth) {
          setParams({ month: j.dp.nextMonth });
          loadCalendar();
        }
      });
  });

  // back/forward
  window.addEventListener('popstate', () => {
    // Recarrega tudo a partir da URL
    bootFromUrl(false);
  });

  // ------------- autocomplete -------------
  function debounce(fn, wait){ let t; return (...a)=>{clearTimeout(t); t=setTimeout(()=>fn(...a), wait);} }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]); }
  function formatTime(dt){ if(!dt) return ''; const d=new Date(dt); return d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }

  const doSearch = debounce(q=>{
    if(!q){ autocompleteList.style.display='none'; return; }
    fetch(`/admin/chatlogs/search?q=${encodeURIComponent(q)}`)
      .then(res=>res.json())
      .then(list=>{
        autocompleteList.innerHTML='';
        if(!Array.isArray(list)||!list.length){ autocompleteList.style.display='none'; return; }
        list.slice(0,8).forEach(item=>{
          const li=document.createElement('li');
          li.tabIndex=0;
          const digits=(item.phoneDigits||(item.phone||'')).toString().replace(/\D/g,'');
          const display=digits ? (digits.startsWith('55')?digits:`55${digits}`) : '';
          li.innerHTML=`<div style="display:flex;justify-content:space-between;gap:12px;">
            <span>${escapeHtml(item.name)}</span>
            <small style="opacity:.7">(${escapeHtml(display)})</small>
          </div>`;
          li.style.padding='10px 12px';
          li.style.cursor='pointer';
          li.addEventListener('click', ()=>{
            // set user, limpar ids & month
            setParams({ user: item.id, ids:'', month:'' });
            // preenche campo
            searchInput.value = `${item.name} (${display})`;
            bootFromUrl(); // carrega calendário + mensagens
            autocompleteList.style.display='none';
          });
          li.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ li.click(); }});
          autocompleteList.appendChild(li);
        });
        autocompleteList.style.display='block';
      })
      .catch(()=>{ autocompleteList.style.display='none'; });
  },160);

  if (searchInput) {
    searchInput.addEventListener('input', (e)=>{
      autocompleteList.style.display='none';
      doSearch(e.target.value.trim());
    });
  }
  document.addEventListener('mousedown', (e)=>{
    if(!autocompleteList.contains(e.target) && e.target!==searchInput){
      autocompleteList.style.display='none';
    }
  });

  // ------------- boot -------------
  function bootFromUrl(){
    const { user } = parseState();
    if (!user) {
      // limpar UI
      renderCalendar(null);
      renderMessages([], '');
      // Remove seleção do botão "Todas mensagens" ao sair do contato
      if (btnAll) btnAll.classList.remove('is-selected');
      return;
    }
    // carrega calendário e mensagens de acordo com ?user&ids&month
    Promise.all([loadCalendar(), loadMessages()]).catch(()=>{});
  }

  // inicializa
  bootFromUrl(false);
});