<?php
  session_start();

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pedidos</title>
    <link rel="stylesheet" href="pedidos.css">
    <link rel="stylesheet" href="menu-listado.css">
</head>
<body>

    <header class="encabezado">
        <div class="header-contenido">
            <h1 class="titulo">
              <a href="index.php" style="text-decoration: none; color: inherit;">
              <img src="images/tazanoble.png" alt="Logo" class="logo">
              <span class="blanco">La Taza</span> <span class="oro">Noble</span>
              </a>
            </h1>
            <div class="menu-icono" onclick="abrirMenu()">☰</div>
            <nav class="menu-escritorio">
            <a href="index.php">Inicio</a>
            <a href="pedidos.php">Pedidos</a>
            <a href="#">Configuración</a>
            <?php if (isset($_SESSION['rol']) && $_SESSION['rol'] === 'admin'): ?>
            <a href="admin_dashboard.php">Panel Admin</a>
            <?php endif; ?>
            <?php if (isset($_SESSION['usuario'])): ?>
            <a href="logout.php">Cerrar sesión</a>
            <?php else: ?>
            <a href="login.php">Iniciar sesión</a>
             <?php endif; ?>
          </nav>
          </div>
          
          <nav class="sidebar" id="sidebar">
            <button class="cerrar-btn" onclick="cerrarMenu()">×</button>
            <a href="index.php">Inicio</a>
            <a href="pedidos.php">Pedidos</a>
            <a href="#">Configuración</a>
            <?php if (isset($_SESSION['rol']) && $_SESSION['rol'] === 'admin'): ?>
            <a href="admin_dashboard.php">Panel Admin</a>
             <?php endif; ?>
             <?php if (isset($_SESSION['usuario'])): ?>
             <a href="logout.php">Cerrar sesión</a>
             <?php else: ?>
             <a href="login.php">Iniciar sesión</a>
             <?php endif; ?>
             </nav>
    </header>

    <div class="carrito">
        <div class="productos">
          <h2>Carrito</h2>
          <div class="producto">
            <img src="images/tazanoble.png" alt="Taza Clásica">
            <div class="info">
              <h3>Cupón Clásico</h3>
              <p>250ml - Cerámica</p>
              <p class="precio" data-precio="50.99">$50.99</p>
              <div class="cantidad">
                <button class="btn-cantidad" onclick="cambiarCantidad(this, -1)">−</button>
                <span class="valor-cantidad">1</span>
                <button class="btn-cantidad" onclick="cambiarCantidad(this, 1)">+</button>
              </div>
            </div>
            <button class="eliminar" onclick="eliminarProducto(this)">✕</button>
          </div>
      
          <div class="producto">
            <img src="images/tazanoble.png" alt="Taza Clásica">
            <div class="info">
              <h3>Taza Clásica</h3>
              <p>250ml - Cerámica</p>
              <p class="precio" data-precio="50.99">$50.99</p>
              <div class="cantidad">
                <button class="btn-cantidad" onclick="cambiarCantidad(this, -1)">−</button>
                <span class="valor-cantidad">1</span>
                <button class="btn-cantidad" onclick="cambiarCantidad(this, 1)">+</button>
              </div>
            </div>
            <button class="eliminar" onclick="eliminarProducto(this)">✕</button>
          </div>
        </div>
      
        <div class="resumen">
            <p><strong><span class="cantidad-articulos">3</span> artículos</strong></p>
            <p>Transporte: Gratis</p>
            <p>Total: $<span class="total-precio">101.98</span></p>
            <p>Impuestos: $<span class="impuestos-precio">21.42</span></p>
            <button>Método de pago</button>
      
          <div class="policies">
            <p>Security policy</p>
            <p>Delivery policy</p>
            <p>Return policy</p>
          </div>
        </div>
      </div>
      
        <footer>
            <p>© 2025 La Taza Noble. Todos los derechos reservados.</p>
        </footer>

<script src="javascript/carritoboton.js"></script>
  <script src="javascript/listado.js" defer></script>
  <script src="javascript/menu-hamburguesa.js" defer></script>
  
</body>
</html>