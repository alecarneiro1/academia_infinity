const Summary   = require('../../models/summaryModel');
const Contact   = require('../../models/contactModel');
const Matricula = require('../../models/matriculaModel');
const { Op }    = require('sequelize');

const PAGE_SIZE = 10; // se quiser paginação

const z = n => String(n).padStart(2, '0');

function toDigits55(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.startsWith('55') ? digits : (digits ? `55${digits}` : '');
}

// ---------- Página (shell) ----------
exports.renderPage = async (req, res) => {
  res.render('admin/atendimentosView', {
    activePath: '/admin/atendimentos'
  });
};

// ---------- Autocomplete (contatos) ----------
exports.searchContacts = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const contacts = await Contact.findAll({
    where: { contactname: { [Op.iLike]: `${q}%` } },
    order: [['contactname', 'ASC']],
    limit: 5
  });
  res.json(contacts.map(c => ({
    id: c.id,
    name: c.contactname,
    phone: c.contactphone || '',
    phoneDigits: toDigits55(c.contactphone)
  })));
};

// ---------- Lista de atendimentos (JSON) ----------
exports.apiList = async (req, res) => {
  try {
    const userId   = Number(req.query.user || 0);
    const idsParam = (req.query.ids || '').trim();
    const page     = Math.max(1, parseInt(req.query.page || '1', 10));

    const where = {};
    if (userId) where.contact = userId;
    if (idsParam) {
      const ids = idsParam.split(',').map(Number).filter(Boolean);
      if (ids.length) where.id = { [Op.in]: ids };
    }

    // consulta
    const { count, rows } = await Summary.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE
    });

    // contatos e matrículas relacionados
    const contactIds = Array.from(new Set(rows.map(r => r.contact).filter(Boolean)));
    const contacts = contactIds.length
      ? await Contact.findAll({
          where: { id: { [Op.in]: contactIds } },
          attributes: ['id', 'contactname', 'contactphone']
        })
      : [];
    const cMap = {};
    contacts.forEach(c => { cMap[c.id] = c; });

    const matriculas = contactIds.length
      ? await Matricula.findAll({
          where: { contact: { [Op.in]: contactIds } },
          attributes: ['id', 'contact']
        })
      : [];
    const mMap = {};
    matriculas.forEach(m => { mMap[m.contact] = m.id; });

    // mapeia cards
    const itens = rows.map(a => {
      let chatIds = [];
      if (Array.isArray(a.chatid)) {
        chatIds = a.chatid.map(id => String(id).replace(/[{}]/g, ''));
      } else if (typeof a.chatid === 'string') {
        chatIds = a.chatid.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
      }
      const c = cMap[a.contact];
      const contato_phoneDigits = toDigits55(c?.contactphone);

      return {
        id: a.id,
        subject: a.subject,
        contatoId: a.contact || null,
        contato: c?.contactname || '-',
        contato_phone: c?.contactphone || '',
        contato_phoneDigits,
        date: a.date,
        start_time: a.start_time,
        end_time: a.end_time,
        duration_minutes: a.duration_minutes,
        summary: a.summary,
        matriculaId: mMap[a.contact] || null,
        chatlogLink: (a.contact && chatIds.length)
          ? `/admin/chatlogs?user=${a.contact}&ids=${encodeURIComponent(chatIds.join(','))}`
          : null
      };
    });

    // header “Mostrando atendimentos para …”
    let contactInfo = null;
    if (userId && cMap[userId]) {
      contactInfo = {
        id: userId,
        contactname: cMap[userId].contactname,
        contactphone: cMap[userId].contactphone || '',
        contactphoneDigits: toDigits55(cMap[userId].contactphone)
      };
    }

    return res.json({
      ok: true,
      items: itens,
      contactInfo,
      page,
      hasMore: (page * PAGE_SIZE) < count
    });
  } catch (err) {
    console.error('apiList atendimentos', err);
    res.status(500).json({ ok:false, error:'list_failed' });
  }
};
