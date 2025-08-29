const Contact = require('../../models/contactModel');

exports.listContacts = async (req, res) => {
    try {
        const contacts = await Contact.findAll({ order: [['id', 'ASC']] });
        res.render('admin/contactsView', {
            contacts,
            activePath: req.baseUrl + req.path
        });
    } catch (err) {
        console.error('Erro ao buscar contatos:', err);
        res.status(500).send('Erro ao buscar contatos');
    }
};
