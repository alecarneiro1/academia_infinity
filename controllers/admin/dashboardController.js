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
            activePath: req.baseUrl + req.path,
            error: (!kpis ? 'Nenhum dado retornado da view v_kpidashboard.' : null)
        });
    } catch (err) {
        console.error('Erro ao buscar KPIs:', err);
        res.render('admin/dashboardView', { kpis: null, atendimentos: [], error: err.message || 'Erro ao buscar KPIs', activePath: req.baseUrl + req.path });
    }
}

// Nova função para obter métricas de mensagens
async function getMessagesMetrics(req, res) {
    try {
        const range = (req.query.range || "today").toLowerCase();

        let rows;
        switch (range) {
            case "today":
            case "hoje":
                rows = await metricsModel.getTodayMessageCounts3h();
                break;
            case "week":
            case "semana":
                rows = await metricsModel.getLast7DaysMessageCounts();
                break;
            case "month":
            case "mes":
            case "mês":
                rows = await metricsModel.getLast30DaysMessageCounts10bins();
                break;
            case "year":
            case "ano":
                rows = await metricsModel.getLast12MonthsMessageCounts();
                break;
            default:
                rows = await metricsModel.getLast7DaysMessageCounts(); // fallback "week"
        }

        const labels = rows.map(r => r.label);
        const values = rows.map(r => Number(r.total) || 0);

        res.json({ labels, values, meta: { range } });
    } catch (err) {
        console.error("metrics.getMessagesMetrics", err);
        res.status(500).json({ error: "Falha ao carregar métricas." });
    }
}

module.exports = {
    getDashboard,
    getMessagesMetrics
};