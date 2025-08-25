(function () {
  const form = document.querySelector(".form");
  if (!form) return;

  const waLocal = document.getElementById("whatsapp_local");
  const waHidden = document.getElementById("whatsapp");
  const cep = document.getElementById("cep");
  const cpf = document.getElementById("cpf");
  const dataNascimento = document.getElementById("data_nascimento");

  /* ========= Helpers ========= */
  const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

  // WhatsApp – formatação ao digitar:
  // mostra como (DD) 9156-2180 (parênteses, espaço e hífen automáticos)
  function maskWhatsDisplay(v) {
    let d = onlyDigits(v);
    // limita DDD+numero a no máx 11 dígitos (incluindo possível 9)
    d = d.slice(0, 13); // margem
    if (d.startsWith("55")) d = d.slice(2);

    const ddd = d.slice(0, 2);
    let local = d.slice(2);

    // Formato visual: (DD) 9156-2180  (4-4)
    // se tiver mais que 8 no local, corta
    local = local.slice(0, 8);

    let out = "";
    if (ddd.length) out = `(${ddd}`;
    if (ddd.length === 2) out += `) `;
    if (local.length) {
      if (local.length <= 4) {
        out += local;
      } else {
        out += `${local.slice(0, 4)}-${local.slice(4)}`;
      }
    }
    return out;
  }

  // WhatsApp – normalização no submit: 55 + DDD + 8 dígitos
  // remove '9' extra após DDD, se existir
  function normalizeWhatsToE164BR(displayValue) {
    let d = onlyDigits(displayValue);
    if (d.startsWith("55")) d = d.slice(2);
    // se vier com 11 dígitos (DDD + 9 + 8), remove o 3º
    if (d.length === 11 && d[2] === "9") d = d.slice(0, 2) + d.slice(3);
    // garante 10 finais
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
      const caret = waLocal.selectionStart;
      waLocal.value = maskWhatsDisplay(waLocal.value);
      // caret simples (suficiente na maioria dos casos)
      waLocal.setSelectionRange(waLocal.value.length, waLocal.value.length);
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

  /* ========= Submit ========= */
  let sending = false;
  form.addEventListener("submit", (e) => {
    if (sending) { e.preventDefault(); return; }

    // normaliza WhatsApp para enviar ao n8n no hidden
    if (waLocal && waHidden) {
      const norm = normalizeWhatsToE164BR(waLocal.value);
      if (!norm) {
        e.preventDefault();
        alert("WhatsApp inválido. Ex.: (42) 9999-9999");
        waLocal.focus();
        return;
      }
      waHidden.value = norm; // ex.: 554291562180
    }

    // normaliza data de nascimento para dd/mm/aaaa
    if (dataNascimento) {
      let d = onlyDigits(dataNascimento.value);
      if (d.length === 8) {
        const dia = d.slice(0, 2);
        const mes = d.slice(2, 4);
        const ano = d.slice(4, 8);
        dataNascimento.value = `${dia}/${mes}/${ano}`;
      } else {
        e.preventDefault();
        alert("Data de nascimento inválida. Use o formato dd/mm/aaaa.");
        dataNascimento.focus();
        return;
      }
    }

    sending = true;
  });
})();
