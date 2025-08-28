document.addEventListener('DOMContentLoaded', function () {
  // Gráfico de mensagens diárias
  const chartEl = document.getElementById('messagesChart');
  if (chartEl) {
    fetch('/admin/api/messages/daily?days=10')
      .then(res => res.json())
      .then(data => {
        const labels = data.map(item => {
          // Formata para dd/MM
          const d = new Date(item.dia);
          return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        });
        const values = data.map(item => Number(item.total));
        // eslint-disable-next-line no-undef
        new Chart(chartEl.getContext('2d'), {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Mensagens',
              data: values,
              backgroundColor: 'rgba(225,29,72,0.7)',
              borderColor: 'rgba(225,29,72,1)',
              borderWidth: 2,
              borderRadius: 6,
              maxBarThickness: 18,
              categoryPercentage: 0.9,
              barPercentage: 0.9,
            }]
          },
          options: {
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#151923',
                titleColor: '#e11d48',
                bodyColor: '#e7e9ee',
                borderColor: 'rgba(225,29,72,0.5)',
                borderWidth: 1,
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#e7e9ee', font: { family: "'Inter', 'Segoe UI', Arial, sans-serif" } }
              },
              y: {
                grid: { color: 'rgba(225,29,72,0.08)' },
                ticks: { color: '#e7e9ee', font: { family: "'Inter', 'Segoe UI', Arial, sans-serif" } },
                beginAtZero: true
              }
            }
          }
        });
      });
  }
});
