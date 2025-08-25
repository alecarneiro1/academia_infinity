(function () {
  const form = document.querySelector(".form");
  if (!form) return;

  const waLocal = document.getElementById("whatsapp_local");
  const waHidden = document.getElementById("whatsapp");
  const cep = document.getElementById("cep");
  const cpf = document.getElementById("cpf");
  const dataNascimento = document.getElementById("data_nascimento");

  const nome = document.getElementById("nome_completo");
  const endereco = document.getElementById("endereco");
  const plano = document.getElementById("plano");
  const origem = document.getElementById("origem");

  const objetivosWrap = document.getElementById("objetivos");

  // Modal
  const overlay = document.getElementById("confirmOverlay");
  const btnEditar = document.getElementById("btnEditar");
  const btnConfirmar = document.getElementById("btnConfirmar");

  // Campos da modal
  const c_nome = document.getElementById("c_nome");
  const c_endereco = document.getElementById("c_endereco");
  const c_cep = document.getElementById("c_cep");
  const c_cpf = document.getElementById("c_cpf");
  const c_whatsapp = document.getElementById("c_whatsapp");
  const c_data = document.getElementById("c_data");
  const c_plano = document.getElementById("c_plano");
  const c_objetivos = document.getElementById("c_objetivos");
  const c_origem = document.getElementById("c_origem");

  /* ========= Helpers ========= */
  const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

  // WhatsApp – formatação ao digitar: (DD) 9156-2180
  function maskWhatsDisplay(v) {
    let d = onlyDigits(v);
    if (d.startsWith("55")) d = d.slice(2);
    d = d.slice(0, 10 + 1); // DDD(2) + 9 extra opcional(1) + 8 (total máx 11 dígitos)

    const ddd = d.slice(0, 2);
    let local = d.slice(2);

    // Monta 4-4 visual
    local = local.slice(0, 8);
    let out = "";
    if (ddd.length) out = `(${ddd}`;
    if (ddd.length === 2) out += `) `;
    if (local.length) {
      if (local.length <= 4) out += local;
      else out += `${local.slice(0, 4)}-${local.slice(4)}`;
    }
    return out;
  }

  // WhatsApp – normalização para enviar ao backend: 55 + DDD + 8 dígitos (remove 9 extra)
  function normalizeWhatsToE164BR(displayValue) {
    let d = onlyDigits(displayValue);
    if (d.startsWith("55")) d = d.slice(2);
    if (d.length === 11 && d[2] === "9") d = d.slice(0, 2) + d.slice(3); // remove 9 logo após DDD
    if (d.length > 10) d = d.slice(-10);
    return d.length === 10 ? "55" + d : null;
  }

  // CEP – 99999-999
  function maskCEP(v) {
    const d = onlyDigits(v).slice(0, 8);
    if (d.length <= 5) return d;
    return d.slice(0, 5) + "-" + d.slice(5);
  }

  // CPF – 000.000.000-00
  function maskCPF(v) {
    const d = onlyDigits(v).slice(0, 11);
    let out = d;
    if (d.length > 3) out = d.slice(0, 3) + "." + d.slice(3);
    if (d.length > 6) out = out.slice(0, 7) + "." + d.slice(6);
    if (d.length > 9) out = out.slice(0, 11) + "-" + d.slice(9);
    return out;
  }

  // Data de nascimento – dd/mm/aaaa
  function maskDataNascimento(v) {
    const d = onlyDigits(v).slice(0, 8);
    let out = d;
    if (d.length > 2) out = d.slice(0, 2) + "/" + d.slice(2);
    if (d.length > 4) out = out.slice(0, 5) + "/" + d.slice(4);
    return out;
  }

  /* ========= Listeners (máscaras em tempo real) ========= */
  if (waLocal) {
    waLocal.addEventListener("input", () => {
      waLocal.value = maskWhatsDisplay(waLocal.value);
    });
  }
  if (cep) {
    cep.addEventListener("input", () => {
      cep.value = maskCEP(cep.value);
    });
  }
  if (cpf) {
    cpf.addEventListener("input", () => {
      cpf.value = maskCPF(cpf.value);
    });
  }
  if (dataNascimento) {
    dataNascimento.addEventListener("input", () => {
      dataNascimento.value = maskDataNascimento(dataNascimento.value);
    });
  }

  /* ========= Modal ========= */
  function openModal() {
    overlay.hidden = false;
    overlay.classList.add("open");
  }
  function closeModal() {
    overlay.classList.remove("open");
    overlay.hidden = true;
  }

  /* ========= Submit com confirmação ========= */
  let confirmedOnce = false;
  form.addEventListener("submit", (e) => {
    if (confirmedOnce) return; // já confirmado → deixa enviar

    e.preventDefault();

    // Normaliza WhatsApp (para modal e hidden)
    const normalizedWa = normalizeWhatsToE164BR(waLocal.value);
    if (!normalizedWa) {
      alert("WhatsApp inválido. Ex.: (42) 9999-9999");
      waLocal.focus();
      return;
    }

    // Valida data de nascimento (8 dígitos)
    let d = onlyDigits(dataNascimento.value);
    if (d.length !== 8) {
      alert("Data de nascimento inválida. Use o formato dd/mm/aaaa.");
      dataNascimento.focus();
      return;
    }
    const dia = d.slice(0, 2);
    const mes = d.slice(2, 4);
    const ano = d.slice(4, 8);
    const dataFormatada = `${dia}/${mes}/${ano}`;

    // Objetivos selecionados (texto do span)
    const objetivosSel = Array.from(objetivosWrap.querySelectorAll('input[type="checkbox"]:checked'))
      .map(chk => chk.value);
    const objetivosStr = objetivosSel.join(", ");

    // Preenche modal
    c_nome.textContent = nome.value.trim();
    c_endereco.textContent = endereco.value.trim();
    c_cep.textContent = cep.value.trim();
    c_cpf.textContent = cpf.value.trim();
    c_whatsapp.textContent = `+${normalizedWa.slice(0,2)} (${normalizedWa.slice(2,4)}) ${normalizedWa.slice(4,8)}-${normalizedWa.slice(8)}`; // +55 (DD) 9999-9999
    c_data.textContent = dataFormatada;
    c_plano.textContent = plano.value;
    c_objetivos.textContent = objetivosStr || "—";
    c_origem.textContent = (origem.value || "—").trim();

    openModal();

    // Botões da modal
    btnEditar.onclick = () => {
      closeModal();
    };
    btnConfirmar.onclick = () => {
      // grava hidden do whatsapp e normaliza data (dd/mm/aaaa)
      waHidden.value = normalizedWa;
      dataNascimento.value = dataFormatada;

      confirmedOnce = true;
      closeModal();
      form.submit(); // envia de verdade
    };
  });

  // Fecha modal clicando fora
  overlay?.addEventListener("click", (ev) => {
    if (ev.target === overlay) closeModal();
  });
})();
