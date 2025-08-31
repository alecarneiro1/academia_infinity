const Contact = require('../../models/contactModel');
const Chatlog  = require('../../models/chatlogModel');
const { Op }   = require('sequelize');

const z = n => String(n).padStart(2, '0');
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho',
               'Agosto','Setembro','Outubro','Novembro','Dezembro'];

/**
 * Constrói metadados do calendário a partir das mensagens de um contato.
 * Agora recebe idsParam para marcar o dia selecionado (.is-selected).
 */
function buildCalendarMeta(rows, monthParam, idsParam) {
  const dayToIds = new Map();   // 'YYYY-MM-DD' -> [ids]
  const monthSet = new Set();   // 'YYYY-MM'
  let latestDate = null;

  rows.forEach(r => {
    const d = new Date(r.time);
    const keyDay   = `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
    const keyMonth = `${d.getFullYear()}-${z(d.getMonth()+1)}`;
    if (!dayToIds.has(keyDay)) dayToIds.set(keyDay, []);
    dayToIds.get(keyDay).push(r.id);
    monthSet.add(keyMonth);
    if (!latestDate || d > latestDate) latestDate = d;
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

/**
 * View principal (SSR, dirigida por URL)
 * /admin/chatlogs
 * /admin/chatlogs/:userid
 * /admin/chatlogs/:userid/:ids
 * Aceita ?month=YYYY-MM p/ mover o calendário.
 */
exports.chatlogView = async (req, res) => {
  const userId    = req.params.userid ? Number(req.params.userid) : null;
  const idsParam  = req.params.ids || '';
  const monthParam = req.query.month;

  if (!userId) {
    return res.render('admin/chatlogView', {
      activePath: '/admin/chatlogs',
      contact: null,
      messages: [],
      userId: null,
      idsParam: '',
      dp: { hasData:false }
    });
  }

  const contact = await Contact.findByPk(userId);
  const allRows = await Chatlog.findAll({
    where: { contactid: userId },
    order: [['time', 'ASC']]
  });

  const dp = buildCalendarMeta(allRows, monthParam, idsParam);

  let messages = allRows;
  if (idsParam) {
    const idList = idsParam.split(',').map(Number).filter(Boolean);
    messages = allRows.filter(m => idList.includes(m.id));
  }

  return res.render('admin/chatlogView', {
    activePath: '/admin/chatlogs',
    contact,
    messages,
    userId,
    idsParam,
    dp
  });
};
