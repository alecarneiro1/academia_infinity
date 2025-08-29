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
  res.json(contacts.map(c => ({ id: c.id, name: c.contactname })));
};

exports.chatlogView = async (req, res) => {
  const userId = req.params.userid;
  const idsParam = req.params.ids;
  const page = parseInt(req.query.page) || 1;
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
