const Info = require('../../models/infoModel');

exports.getInfoList = async (req, res) => {
    try {
        const infos = await Info.findAll({ order: [['id', 'ASC']] });
        res.render('admin/agenteView', { 
            infos,
            activePath: req.baseUrl + req.path // Adicione esta linha
        });
    } catch (err) {
        console.error('Erro ao buscar infos:', err);
        res.status(500).send('Erro ao buscar informações');
    }
};

exports.updateInfo = async (req, res) => {
    try {
        // Para debug: log do body recebido
        console.log('Headers recebidos:', req.headers);
        console.log('Body recebido:', req.body);

        // Checagem extra: req.body pode ser string se o body parser não está funcionando
        if (!req.body || typeof req.body !== 'object') {
            console.error('req.body está indefinido ou não é objeto:', req.body);
            return res.status(400).send('Body parser não está funcionando ou o formulário está com enctype errado.');
        }

        let conteudo = req.body.conteudo;
        if (Array.isArray(conteudo)) {
            conteudo = conteudo[0];
        }

        const { id } = req.params;
        if (typeof conteudo === 'undefined' || conteudo === null) {
            console.error('Campo conteudo não enviado no body:', req.body);
            return res.status(400).send('Campo conteudo é obrigatório');
        }
        await Info.update({ conteudo }, { where: { id } });
        // AJAX: responde 200 OK sem redirect
        if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            return res.status(200).end();
        }
        res.redirect('/admin/agente');
    } catch (err) {
        console.error('Erro ao atualizar info:', err);
        if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            return res.status(400).send(err.message || 'Erro ao atualizar informação');
        }
        res.status(500).send('Erro ao atualizar informação');
    }
};