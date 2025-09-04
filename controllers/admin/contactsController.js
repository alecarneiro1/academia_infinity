const Contact   = require('../../models/contactModel');
const Matricula = require('../../models/matriculaModel');
const Summary   = require('../../models/summaryModel');
const { Op }    = require('sequelize');

// Página shell: sem carregar todos os contatos no SSR
exports.renderContactsPage = async (req, res) => {
  res.render('admin/contactsView', {
    activePath: req.baseUrl + req.path
  });
};

// AJAX com busca + paginação (offset/limit)
exports.searchContacts = async (req, res) => {
  try {
    const q       = (req.query.q || '').trim();
    const offset  = Number(req.query.offset ?? 0) || 0;
    let   limit   = Number(req.query.limit  ?? 9) || 9;

    // sanidade
    if (limit > 50) limit = 50;
    if (limit < 1)  limit = 1;

    const where = q
      ? { contactname: { [Op.iLike]: `%${q}%` } }
      : {};

    // Busca paginada + total
    const { rows, count } = await Contact.findAndCountAll({
      where,
      order: [['id', 'DESC']], // <-- alterado para mostrar os mais recentes primeiro
      offset,
      limit
    });

    // Enriquecer com matriculaId e atendimentoIds
    const contactsWithExtras = await Promise.all(rows.map(async c => {
      const matricula = await Matricula.findOne({ where: { contact: c.id } });
      const summaries = await Summary.findAll({ where: { contact: c.id }, attributes: ['id'] });
      return {
        ...c.dataValues,
        matriculaId: matricula ? matricula.id : null,
        atendimentoIds: summaries.map(s => s.id)
      };
    }));

    const nextOffset = offset + rows.length;
    const hasMore = nextOffset < count;

    res.json({
      ok: true,
      contacts: contactsWithExtras,
      total: count,
      nextOffset,
      hasMore
    });
  } catch (err) {
    console.error('searchContacts error:', err);
    res.status(200).json({ ok: false, contacts: [], total: 0, nextOffset: 0, hasMore: false });
  }
};
