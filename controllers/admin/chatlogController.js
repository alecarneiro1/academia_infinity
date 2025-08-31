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
  const page = parseInt(req.query.page) || 1;

  // Se meta=days, retorna dias com mensagens e ids por dia
  if (req.query.meta === 'days') {
    // Busca todos os dias com mensagens para o contato
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
      const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!daysMap[dayStr]) daysMap[dayStr] = [];
      daysMap[dayStr].push(r.id);
      allIds.push(r.id);
      if (year === null) year = d.getFullYear();
      if (month === null) month = d.getMonth();
    });
    const days = Object.keys(daysMap).map(date => ({
      date,
      ids: daysMap[date]
    }));
    // Para o título do mês
    let monthLabel = '';
    if (year !== null && month !== null) {
      const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      monthLabel = `${meses[month]} ${year}`;
    }
    return res.json({ days, allIds, year, month, monthLabel });
  }

  // Se json=1, retorna mensagens por ids
  if (req.query.json == '1' && idsParam) {
    const ids = idsParam.split(',').map(Number).filter(Boolean);
    const rows = await Chatlog.findAll({
      where: { id: { [Op.in]: ids }, contactid: userId },
      order: [['time', 'ASC']]
    });
    return res.json({ messages: rows });
  }

  let where = { contactid: userId };
  if (idsParam) {
    const ids = idsParam.split(',').map(Number).filter(Boolean);
    where.id = { [Op.in]: ids };
  }
  const { count, rows } = await Chatlog.findAndCountAll({
    where,
    order: [['id', 'ASC']],
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  });
  const contact = await Contact.findByPk(userId);
  // API para paginação
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.json({
      messages: rows.map(m => ({
        id: m.id,
        usermessage: m.usermessage,
        agentresponse: m.agentresponse,
        time: m.time
      })),
      hasMore: (page * PAGE_SIZE) < count
    });
  }
  res.render('admin/chatlogView', {
    contact,
    messages: rows,
    hasMore: (page * PAGE_SIZE) < count,
    userId,
    idsParam: idsParam || '',
    activePath: '/admin/chatlogs'
  });
};
