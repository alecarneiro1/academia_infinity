const Summary = require('../../models/summaryModel');
const Contact = require('../../models/contactModel');
const Matricula = require('../../models/matriculaModel');
const { Op } = require('sequelize');

const PAGE_SIZE = 10;

exports.listAtendimentos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const idsParam = req.params.ids;
    let where = {};
    if (idsParam) {
      const ids = idsParam.split(',').map(Number).filter(Boolean);
      where.id = { [Op.in]: ids };
    }
    const { count, rows } = await Summary.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    });

    // Busca contatos e matrículas relacionados
    const contactIds = rows.map(r => r.contact).filter(Boolean);
    const contacts = await Contact.findAll({
      where: { id: { [Op.in]: contactIds } },
      attributes: ['id', 'contactname', 'contactphone'],
    });
    const contactMap = {};
    contacts.forEach(c => { contactMap[c.id] = c; });

    // Busca matrículas relacionadas
    const matriculas = await Matricula.findAll({
      where: { contact: { [Op.in]: contactIds } },
      attributes: ['id', 'contact'],
    });
    const matriculaMap = {};
    matriculas.forEach(m => { matriculaMap[m.contact] = m.id; });

    // Monta dados para view
    const atendimentos = rows.map(a => {
      // Extrai ids do chatid (array ou string com {})
      let chatIds = [];
      if (Array.isArray(a.chatid)) {
        chatIds = a.chatid.map(id => String(id).replace(/[{}]/g, ''));
      } else if (typeof a.chatid === 'string') {
        chatIds = a.chatid.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
      }
      const chatlogLink = (a.contact && chatIds.length)
        ? `/admin/chatlog/${a.contact}/${chatIds.join(',')}`
        : null;
      return {
        id: a.id,
        subject: a.subject,
        contato: contactMap[a.contact]?.contactname || '-',
        contato_phone: contactMap[a.contact]?.contactphone || '',
        date: a.date,
        start_time: a.start_time,
        end_time: a.end_time,
        duration_minutes: a.duration_minutes,
        summary: a.summary,
        matriculaId: matriculaMap[a.contact] || null,
        chatlogLink
      };
    });

    // Se for AJAX (API), retorna JSON
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ atendimentos, hasMore: (page * PAGE_SIZE) < count });
    }

    res.render('admin/atendimentosView', {
      atendimentos,
      hasMore: (page * PAGE_SIZE) < count,
      idsParam: idsParam || '',
      activePath: '/admin/atendimentos'
    });
  } catch (err) {
    console.error('Erro ao buscar atendimentos:', err);
    res.status(500).send('Erro ao buscar atendimentos');
  }
};
