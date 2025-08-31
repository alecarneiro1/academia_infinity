const Contact = require('../../models/contactModel');
const Matricula = require('../../models/matriculaModel');
const Summary = require('../../models/summaryModel');
const { Op } = require('sequelize');

exports.listContacts = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        let contactsWithExtras = [];
        if (q) {
            const contacts = await Contact.findAll({
                where: { contactname: { [Op.iLike]: `%${q}%` } },
                order: [['id', 'ASC']]
            });
            contactsWithExtras = await Promise.all(contacts.map(async c => {
                const matricula = await Matricula.findOne({ where: { contact: c.id } });
                const summaries = await Summary.findAll({ where: { contact: c.id }, attributes: ['id'] });
                return {
                    ...c.dataValues,
                    matriculaId: matricula ? matricula.id : null,
                    atendimentoIds: summaries.map(s => s.id)
                };
            }));
        }
        res.render('admin/contactsView', {
            contacts: contactsWithExtras,
            activePath: req.baseUrl + req.path
        });
    } catch (err) {
        console.error('Erro ao buscar contatos:', err);
        res.status(500).send('Erro ao buscar contatos');
    }
};

exports.searchContacts = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ contacts: [] });
    const contacts = await Contact.findAll({
      where: { contactname: { [Op.iLike]: `%${q}%` } },
      order: [['id', 'ASC']]
    });
    const contactsWithExtras = await Promise.all(contacts.map(async c => {
      const matricula = await Matricula.findOne({ where: { contact: c.id } });
      const summaries = await Summary.findAll({ where: { contact: c.id }, attributes: ['id'] });
      return {
        ...c.dataValues,
        matriculaId: matricula ? matricula.id : null,
        atendimentoIds: summaries.map(s => s.id)
      };
    }));
    res.json({ contacts: contactsWithExtras });
  } catch (err) {
    res.json({ contacts: [] });
  }
};
