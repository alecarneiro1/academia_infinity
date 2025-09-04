document.addEventListener('DOMContentLoaded', function () {
  // Gráfico de mensagens 
  const chartEl = document.getElementById('messagesChart');
  let messagesChart = null;
  
  function loadChart(range = 'week') {
    if (chartEl) {
      fetch(`/admin/dashboard/messages-metrics?range=${range}`)
        .then(res => res.json())
        .then(data => {
          // Garante que o canvas sempre ocupe 100% da largura
          chartEl.style.width = '100%';
          chartEl.style.maxWidth = '100%';
          chartEl.style.display = 'block';
          chartEl.height = 400;

          const config = {
            type: 'line',
            data: {
              labels: data.labels,
              datasets: [{
                label: 'Mensagens',
                data: data.values,
                backgroundColor: 'rgba(225,29,72,0.2)',
                borderColor: 'rgba(225,29,72,1)',
                borderWidth: 2,
                tension: 0.3,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'rgba(225,29,72,1)',
                pointRadius: 4,
                fill: true
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
                  padding: 10,
                  displayColors: false
                }
              },
              maintainAspectRatio: false,
              responsive: true,
              scales: {
                x: {
                  grid: { display: false, drawBorder: false },
                  ticks: { color: '#9aa3af' }
                },
                y: {
                  grid: { color: 'rgba(255,255,255,0.05)' },
                  ticks: { color: '#9aa3af' },
                  beginAtZero: true
                }
              }
            }
          };
          
          // Destruir gráfico anterior se existir
          if (messagesChart) {
            messagesChart.destroy();
          }
          
          // Criar novo gráfico
          messagesChart = new Chart(chartEl, config);
        })
        .catch(error => {
          console.error('Erro ao carregar dados do gráfico:', error);
        });
    }
  }
  
  // Botões de filtro
  const filterButtons = document.querySelectorAll('.filters [data-range]');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove classe ativa de todos os botões
      filterButtons.forEach(b => b.classList.remove('is-active'));
      // Adiciona classe ativa ao botão clicado
      this.classList.add('is-active');
      // Carrega gráfico com o range especificado
      loadChart(this.dataset.range);
    });
  });
  
  // Carrega o gráfico inicial (hoje)
  loadChart('today');
  // Marca o botão de "Hoje" como ativo inicialmente
  document.querySelector('[data-range="today"]')?.classList.add('is-active');
});
