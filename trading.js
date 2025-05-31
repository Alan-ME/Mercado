document.addEventListener("DOMContentLoaded", () => {
  const cupones = [
    { tipo: "basico", precio: 150 },
    { tipo: "premium", precio: 300 },
    { tipo: "dorado", precio: 600 }
  ];

  cupones.forEach(cupon => {
    const card = document.querySelector(`.cupon-card[data-tipo="${cupon.tipo}"]`);
    const precioElem = card.querySelector(".precio");
    const canvas = card.querySelector
    ("canvas");
    const ctx = canvas.getContext("2d");

    let historial = [cupon.precio];
    let etiquetas = [new Date().toLocaleTimeString()];
    precioElem.textContent = cupon.precio;

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: etiquetas,
        datasets: [{
          label: 'Precio',
          data: historial,
          fill: false,
          borderColor: '#f5c542',
          tension: 0.1
        }]
      },
      options: {
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: { color: '#fff' }
          },
          x: {
            ticks: { color: '#fff' }
          }
        }
      }
    });

    // Actualizar precio cada 5 segundos
    setInterval(() => {
      let cambio = Math.floor(Math.random() * 21) - 10; // -10 a +10
      cupon.precio = Math.max(10, cupon.precio + cambio); // nunca menos de 10
      historial.push(cupon.precio);
      etiquetas.push(new Date().toLocaleTimeString());

      if (historial.length > 10) {
        historial.shift();
        etiquetas.shift();
      }

      chart.data.labels = etiquetas;
      chart.data.datasets[0].data = historial;
      chart.update();
      precioElem.textContent = cupon.precio;
    }, 5000);
  });
});
