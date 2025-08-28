const kpiDashboardModel = require('../../models/kpiDashboardModel');

exports.getDashboard = async (req, res) => {
    try {
        const kpis = await kpiDashboardModel.getDashboardKpis();
        res.render('admin/dashboardView', {
            kpis: kpis ? {
                total_mensages: kpis.total_mensages,
                total_contacts: kpis.total_contacts,
                total_summaries: kpis.total_summaries,
                total_matriculas: kpis.total_matriculas
            } : null,
            error: (!kpis ? 'Nenhum dado retornado da view v_kpidashboard.' : null)
        });
    } catch (err) {
        console.error('Erro ao buscar KPIs:', err);
        res.render('admin/dashboardView', { kpis: null, error: err.message || 'Erro ao buscar KPIs' });
    }
};

