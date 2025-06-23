function cambiarCantidad(btn, cambio) {
    const cantidadSpan = btn.parentElement.querySelector('.valor-cantidad');
    let cantidad = parseInt(cantidadSpan.textContent);
    cantidad = Math.max(1, cantidad + cambio);
    cantidadSpan.textContent = cantidad;
  
    const producto = btn.closest('.producto');
    const precioTag = producto.querySelector('.precio');
    const precioUnitario = parseFloat(precioTag.dataset.precio);
    const precioTotal = (precioUnitario * cantidad).toFixed(2);
  
    precioTag.textContent = `$${precioTotal}`;
  
    actualizarTotales();
  }
  
  function eliminarProducto(btn) {
    const producto = btn.closest('.producto');
    producto.remove();
    actualizarTotales();
  }
  
  function actualizarTotales() {
    const productos = document.querySelectorAll('.producto');
    let total = 0;
    let cantidadArticulos = 0;
  
    productos.forEach(producto => {
      const cantidad = parseInt(producto.querySelector('.valor-cantidad').textContent);
      const precioUnitario = parseFloat(producto.querySelector('.precio').dataset.precio);
      total += cantidad * precioUnitario;
      cantidadArticulos += cantidad;
    });
  
    const impuestos = (total * 0.21).toFixed(2);
    const totalRedondeado = total.toFixed(2);
  
    document.querySelector('.total-precio').textContent = totalRedondeado;
    document.querySelector('.impuestos-precio').textContent = impuestos;
    document.querySelector('.cantidad-articulos').textContent = cantidadArticulos;
  }
  