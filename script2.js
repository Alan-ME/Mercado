  const opcionesLeche = document.querySelectorAll('.opcion');
  const totalExtra = document.getElementById('totalExtra');

  opcionesLeche.forEach(cb => {
    cb.addEventListener('change', () => {
      // Si este fue seleccionado
      if (cb.checked) {
        // Deshabilita todos menos el que está marcado
        opcionesLeche.forEach(other => {
          if (other !== cb) {
            other.disabled = true;
          }
        });
      } else {
        // Si se desmarcó, re-habilita todos
        opcionesLeche.forEach(other => {
          other.disabled = false;
        });
      }

      // Calcular total adicional
      let total = 0;
      opcionesLeche.forEach(item => {
        if (item.checked) {
          total += parseInt(item.value);
        }
      });
      totalExtra.textContent = 'Total adicional: $' + total;
    });
  });