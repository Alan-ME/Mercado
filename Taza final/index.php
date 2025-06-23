<?php
  session_start();

  //session_destroy(); die();
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>La Taza Noble</title>
  <link rel="stylesheet" href="index.css" />
  <link rel="stylesheet" href="carrusel.css">
  <link rel="stylesheet" href="modal.css">
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
      <a href="configuracion.php">Configuración</a>
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
      <a href="configuracion.php">Configuración</a>
      <?php if (isset($_SESSION['usuario']) && $_SESSION['usuario'] === 'admin'): ?>
      <a href="admin_dashboard.php">Panel Admin</a>
      <?php endif; ?>
      <?php if (isset($_SESSION['usuario'])): ?>
      <a href="logout.php">Cerrar sesión</a>
     <?php else: ?>
      <a href="login.php">Iniciar sesión</a>
     <?php endif; ?>
    </nav>
  </header>

  <main>
    <section class="carrusel">
      <div class="carrusel-imagenes">
        <img src="images/cafecito.png" alt="Imagen 1">
        <img src="images/SBX20190617_CaffeAmericano.jpg" alt="Imagen 2">
        <img src="images/SBX20190617_CaffeAmericano.jpg" alt="Imagen 3">
      </div>
      <button class="antes">&#10094;</button>
      <button class="despues">&#10095;</button>
      <div class="carrusel-puntos"></div>
    </section>

    <section class="bebidas">
      <h2 class="seccion-titulo">Explora Nuestras Bebidas</h2>
      <div class="grid-bebidas">
        <div class="card">
          <img src="images/C-caliente.png" alt="Cafés calientes">
          <p>Cafés calientes</p>
          <button class="boton1">Pedir</button>
        </div>
        <div class="card">
          <img src="images/c-helado.png" alt="Cafés helados">
          <p>Cafés helados</p>
          <button class="boton2">Pedir</button>
        </div>
        <div class="card">
          <img src="images/frappu.png" alt="Frappuccino">
          <p>Frappuccino</p>
          <button class="boton3">Pedir</button>
        </div>
        <div class="card">
          <img src="images/tecal.png" alt="Té caliente">
          <p>Té caliente</p>
          <button class="boton4">Pedir</button>
        </div>
        <div class="card">
          <img src="images/tehel.png" alt="Té helado">
          <p>Té helado</p>
          <button class="boton5">Pedir</button>
        </div>
        <div class="card">
          <img src="images/heladas.png" alt="Heladas">
          <p>Heladas</p>
          <button class="boton6">Pedir</button>
        </div>
      </div>

      <div id="loginModal" class="modal">
        <div class="modal-content">
          <div class="cafe">
            <img src="images/C-caliente.png" alt="">
          </div>
          <form action="" class="informacion">
            <h2>Informacion</h2>
            <div class="divider"><span>-</span></div>
            <div class="ingredientes">

            <label>Cupón Basico (+$5)
           <input type="checkbox" value="5" class="opcion">
           </label>

           <label>Cupón Premium (+$20)
           <input type="checkbox" value="20" class="opcion">
           </label>

           <label>Cupón Elite (+$50)
           <input type="checkbox" value="50" class="opcion">
           </label>

           <label>Cupón VIP (+$100)
           <input type="checkbox" value="100" class="opcion">
           </label>

           <div id="totalExtra">Total adicional: $0</div>
           </div>
            <button>Pagar</button>
            </div>
            
          </form>
        </div>
      </div>
    </section>
  </main>

  <footer class="pie">
    <p>© 2025 La Taza Noble. Todos los derechos reservados.</p>
    <p>Síguenos en redes sociales</p>
    <div class="redes">
      <a href="#" aria-label="Instagram"><img src="img/instagram.svg" alt="Instagram"></a>
      <a href="#" aria-label="Facebook"><img src="img/facebook.svg" alt="Facebook"></a>
      <a href="#" aria-label="X"><img src="img/twitter.svg" alt="Twitter"></a>
    </div>
  </footer>

  <script src="javascript/modal.js" defer></script>
  <script src="javascript/opciones-modal.js" defer></script>
  <script src="javascript/listado.js" defer></script>
  <script src="javascript/Carrusel.js" defer></script>
  <script src="javascript/menu-hamburguesa.js" defer></script>

  
  
</body>
</html>
