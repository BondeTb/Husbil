function visaTid() {
    const nu = new Date().toLocaleTimeString();
    document.getElementById("output").textContent = "Klockan är: " + nu;
  }
  let gasChart;

  function hämtaGasdataOchRita() {
    fetch("https://prinsessa.husbil.org/gasdata")
      .then(res => res.json())
      .then(data => {
        const labels = data.map(p => new Date(p.time).toLocaleTimeString());
        const values = data.map(p => p.value);
  
        if (gasChart) {
          gasChart.data.labels = labels;
          gasChart.data.datasets[0].data = values;
          gasChart.update();
        } else {
          const ctx = document.getElementById("gasGraf").getContext("2d");
          gasChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                label: 'Gasnivå',
                data: values,
                borderWidth: 2,
                borderColor: 'blue',
                fill: false
              }]
            },
            options: {
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }
      })
      .catch(err => {
        console.error("Fel vid hämtning av gasdata:", err);
      });
  }
  
  
  // Uppdatera varje minut
  setInterval(hämtaGasdataOchRita, 60000);
  hämtaGasdataOchRita(); // Kör direkt vid start
    