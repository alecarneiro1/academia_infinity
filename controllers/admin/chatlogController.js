const Contact = require('../../models/contactModel');
const Chatlog  = require('../../models/chatlogModel');
const { Op }   = require('sequelize');

const z = n => String(n).padStart(2, '0');
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho',
               'Agosto','Setembro','Outubro','Novembro','Dezembro'];

/** Monta metadados do calendário a partir das mensagens de um contato. */
function buildCalendarMeta(rows, monthParam, idsParam) {
  const dayToIds = new Map();   // 'YYYY-MM-DD' -> [ids]
  const monthSet = new Set();   // 'YYYY-MM'
  rows.forEach(r => {
    const d = new Date(r.time);
    const keyDay   = `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
    const keyMonth = `${d.getFullYear()}-${z(d.getMonth()+1)}`;
    if (!dayToIds.has(keyDay)) dayToIds.set(keyDay, []);
    dayToIds.get(keyDay).push(r.id);
    monthSet.add(keyMonth);
  });

  const monthsDesc = Array.from(monthSet).sort().reverse();
  if (!monthsDesc.length) return { hasData:false };

  const chosen = (monthParam && monthsDesc.includes(monthParam)) ? monthParam : monthsDesc[0];
  const [yy, mm] = chosen.split('-').map(Number);
  const y = yy, mIdx = mm - 1;

  const firstWeekday = new Date(y, mIdx, 1).getDay();
  const daysInMonth  = new Date(y, mIdx + 1, 0).getDate();

  const idsParamNormalized = String(idsParam || '').trim();

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${y}-${z(mIdx+1)}-${z(d)}`;
    const ids = dayToIds.get(key) || [];
    const idsStr = ids.join(',');
    const active = ids.length > 0;
    const selected = active && idsParamNormalized && (idsStr === idsParamNormalized);
    days.push({ day:d, active, ids, selected });
  }

  const idx     = monthsDesc.indexOf(chosen);
  const hasPrev = (idx < monthsDesc.length - 1);
  const hasNext = (idx > 0);
  const prevMonth = hasPrev ? monthsDesc[idx+1] : null;
  const nextMonth = hasNext ? monthsDesc[idx-1] : null;

  return {
    hasData:true,
    chosen,
    label: `${MESES[mIdx]} ${y}`,
    year: y,
    monthIndex: mIdx,
    firstWeekday,
    daysInMonth,
    days,
    hasPrev, prevMonth,
    hasNext, nextMonth
  };
}

// --------- Página (shell) ----------
exports.renderPage = async (req, res) => {
  // A página carrega “vazia”; o JS lê ?user&ids&month e faz AJAX
  res.render('admin/chatlogView', {
    activePath: '/admin/chatlogs'
  });
};

// --------- Autocomplete ----------
exports.searchContacts = async (req, res) => {
  const q = req.query.q || '';
  if (!q) return res.json([]);
  const contacts = await Contact.findAll({
    where: { contactname: { [Op.iLike]: `${q}%` } },
    order: [['contactname', 'ASC']],
    limit: 10
  });
  res.json(contacts.map(c => {
    const digits = (c.contactphone || '').replace(/\D/g,'');
    const displayDigits = digits.startsWith('55') ? digits : `55${digits}`;
    return { id:c.id, name:c.contactname, phone:c.contactphone||'', phoneDigits:displayDigits };
  }));
};

// --------- API: Calendar (JSON) ----------
exports.apiCalendar = async (req, res) => {
  try {
    const userId    = Number(req.query.user || 0);
    const month     = req.query.month || '';
    const idsParam  = req.query.ids || '';

    if (!userId) return res.json({ ok:true, dp:{ hasData:false }, contact:null });

    const contact = await Contact.findByPk(userId);
    const allRows = await Chatlog.findAll({
      where: { contactid: userId },
      attributes: ['id','time'],
      order: [['time','ASC']]
    });

    const dp = buildCalendarMeta(allRows, month, idsParam);
    return res.json({
      ok: true,
      contact: contact ? { id: contact.id, name: contact.contactname } : null,
      dp
    });
  } catch (err) {
    console.error('apiCalendar', err);
    res.status(500).json({ ok:false, error:'calendar_failed' });
  }
};

// --------- API: Messages (JSON) ----------
exports.apiMessages = async (req, res) => {
  try {
    const userId   = Number(req.query.user || 0);
    const idsParam = (req.query.ids || '').trim();

    if (!userId) return res.json({ ok:true, items:[], contact:null });

    const contact = await Contact.findByPk(userId);

    let where = { contactid: userId };
    if (idsParam) {
      const idList = idsParam.split(',').map(Number).filter(Boolean);
      where.id = { [Op.in]: idList };
    }

    const rows = await Chatlog.findAll({
      where,
      order: [['time','ASC']]
    });

    const items = rows.map(r => ({
      id: r.id,
      usermessage: r.usermessage,
      agentresponse: r.agentresponse,
      time: r.time
    }));

    return res.json({
      ok: true,
      contact: contact ? { id: contact.id, name: contact.contactname } : null,
      items
    });
  } catch (err) {
    console.error('apiMessages', err);
    res.status(500).json({ ok:false, error:'messages_failed' });
  }
};
