const kpiDashboardModel = require('../../models/kpiDashboardModel');
const metricsModel = require('../../models/metricsModel');
const Summary = require('../../models/summaryModel');
const Contact = require('../../models/contactModel');

async function getDashboard(req, res) {
    try {
        const kpis = await kpiDashboardModel.getDashboardKpis();

        // Busca os últimos 5 summaries com join no contato
        const summaries = await Summary.findAll({
            order: [['created_at', 'DESC']],
            limit: 5,
            include: [{
                model: Contact,
                as: 'contactInfo',
                attributes: ['contactname']
            }]
        });

        const atendimentos = summaries.map(s => ({
            id: s.id,
            assunto: s.subject,
            contato: (s.contactInfo && s.contactInfo.contactname) || '-',
            data: s.created_at
        }));

        res.render('admin/dashboardView', {
            kpis: kpis ? {
                total_mensages: kpis.total_mensages,
                total_contacts: kpis.total_contacts,
                total_summaries: kpis.total_summaries,
                total_matriculas: kpis.total_matriculas
            } : null,
            atendimentos,
            activePath: req.baseUrl + req.path, // Adicione esta linha
            error: (!kpis ? 'Nenhum dado retornado da view v_kpidashboard.' : null)
        });
    } catch (err) {
        console.error('Erro ao buscar KPIs:', err);
        res.render('admin/dashboardView', { kpis: null, atendimentos: [], error: err.message || 'Erro ao buscar KPIs', activePath: req.baseUrl + req.path });
    }
}

async function getDailyMessages(req, res, next) {
    try {
        const ndays = Number(req.query.days || 10);
        const rows = await metricsModel.getDailyMessageCounts(ndays);
        res.json(rows);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getDashboard,
    getDailyMessages
};