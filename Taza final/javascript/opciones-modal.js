  const opcionesLeche = document.querySelectorAll('.opcion');
  const totalExtra = document.getElementById('totalExtra');

  opcionesLeche.forEach(cb => {
    cb.addEventListener('change', () => {
      
      if (cb.checked) {
        opcionesLeche.forEach(other => {
          if (other !== cb) {
            other.disabled = true;
          }
        });
      } else {
        opcionesLeche.forEach(other => {
          other.disabled = false;
        });
      }

      let total = 0;
      opcionesLeche.forEach(item => {
        if (item.checked) {
          total += parseInt(item.value);
        }
      });
      totalExtra.textContent = 'Total adicional: $' + total;
    });
  });