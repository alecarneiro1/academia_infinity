const Contact = require('../../models/contactModel');
const Matricula = require('../../models/matriculaModel');
const Summary = require('../../models/summaryModel');

exports.listContacts = async (req, res) => {
    try {
        const contacts = await Contact.findAll({ order: [['id', 'ASC']] });

        // Busca matrículas e atendimentos para cada contato
        const contactsWithExtras = await Promise.all(contacts.map(async c => {
            // Matrícula (pega a primeira encontrada)
            const matricula = await Matricula.findOne({ where: { contact: c.id } });
            // Atendimentos (ids)
            const summaries = await Summary.findAll({ where: { contact: c.id }, attributes: ['id'] });
            return {
                ...c.dataValues,
                matriculaId: matricula ? matricula.id : null,
                atendimentoIds: summaries.map(s => s.id)
            };
        }));

        res.render('admin/contactsView', {
            contacts: contactsWithExtras,
            activePath: req.baseUrl + req.path
        });
    } catch (err) {
        console.error('Erro ao buscar contatos:', err);
        res.status(500).send('Erro ao buscar contatos');
    }
};
