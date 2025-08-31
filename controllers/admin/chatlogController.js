const Contact = require('../../models/contactModel');
const Chatlog = require('../../models/chatlogModel');
const { Op } = require('sequelize');

const PAGE_SIZE = 10;

exports.searchContacts = async (req, res) => {
  const q = req.query.q || '';
  if (!q) return res.json([]);
  const contacts = await Contact.findAll({
    where: { contactname: { [Op.iLike]: `${q}%` } },
    order: [['contactname', 'ASC']],
    limit: 10
  });
  res.json(contacts.map(c => {
    const digits = (c.contactphone || '').replace(/\D/g, '');
    // garante código de país (55) no display se não vier
    const displayDigits = digits.startsWith('55') ? digits : `55${digits}`;
    return {
      id: c.id,
      name: c.contactname,
      phone: c.contactphone || '',
      phoneDigits: displayDigits
    };
  }));
};

exports.chatlogView = async (req, res) => {
  const userId = req.params.userid;
  const idsParam = req.params.ids;
  const wantsJson = (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1));

  // 1) Metadados de dias (para o datepicker)
  if (req.query.meta === 'days') {
    const rows = await Chatlog.findAll({
      where: { contactid: userId },
      attributes: ['id', 'time'],
      order: [['time', 'ASC']]
    });
    const daysMap = {};
    const allIds = [];
    let year = null, month = null;
    rows.forEach(r => {
      const d = new Date(r.time);
      const dayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      (daysMap[dayStr] ||= []).push(r.id);
      allIds.push(r.id);
      if (year === null) year = d.getFullYear();
      if (month === null) month = d.getMonth();
    });
    const days = Object.keys(daysMap).map(date => ({ date, ids: daysMap[date] }));
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const monthLabel = (year !== null && month !== null) ? `${meses[month]} ${year}` : '';
    return res.json({ days, allIds, year, month, monthLabel });
  }

  // 2) JSON de mensagens por ids (AJAX)
  if (req.query.json == '1' && idsParam) {
    const ids = idsParam.split(',').map(Number).filter(Boolean);
    const rows = await Chatlog.findAll({
      where: { id: { [Op.in]: ids }, contactid: userId },
      order: [['time', 'ASC']]
    });
    return res.json({ messages: rows });
  }

  // 3) SSR (sem paginação)
  const contact = await Contact.findByPk(userId);
  const where = { contactid: userId };

  if (idsParam) {
    const ids = idsParam.split(',').map(Number).filter(Boolean);
    where.id = { [Op.in]: ids };
  }

  const messages = await Chatlog.findAll({
    where,
    order: [['time', 'ASC']]
  });

  // API para paginação (se algum consumer antigo ainda chamar HTML com Accept: json)
  if (wantsJson) {
    return res.json({
      messages: messages.map(m => ({
        id: m.id,
        usermessage: m.usermessage,
        agentresponse: m.agentresponse,
        time: m.time
      })),
      hasMore: false
    });
  }

  // SSR: renderiza a página já com as mensagens
  res.render('admin/chatlogView', {
    contact,
    messages,
    hasMore: false,
    userId,
    idsParam: idsParam || '',
    activePath: '/admin/chatlogs'
  });
};