<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Configuración</title>
  <link rel="stylesheet" href="index.css" />
  <style>
    .config-container {
      display: flex;
      flex-direction: row;
      gap: 20px;
    }

    .config-menu {
      width: 250px;
      background-color: #111;
      border-right: 2px solid #333;
      padding: 20px;
    }

    .config-menu ul {
      list-style: none;
      padding: 0;
    }

    .config-menu li {
      margin-bottom: 15px;
      color: #ccc;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: color 0.2s ease;
    }

    .config-menu li:hover,
    .config-menu li.active {
      color: gold;
    }

    .config-content {
      flex: 1;
      background-color: #0a0a0a;
      padding: 20px;
      border: 2px solid #333;
    }

    .config-block {
      background-color: #111;
      border: 1px solid #333;
      margin-bottom: 20px;
      padding: 15px 20px;
      border-radius: 6px;
      display: none;
    }

    .config-block.active {
      display: block;
    }

    .config-block h3 {
      margin-top: 0;
      color: gold;
      font-size: 1.2rem;
    }

    .config-block p {
      color: #aaa;
      font-size: 0.9rem;
      margin-bottom: 5px;
    }

    .config-block:hover {
      background-color: #1a1a1a;
    }

    .icono {
      filter: brightness(0) invert(1);
      width: 18px;
    }
  </style>
</head>
<body>

  <header class="encabezado">
    <div class="titulo">
      <img src="logo.png" alt="Logo" class="logo" />
      <span class="blanco">Panel</span><span class="oro">Configuración</span>
    </div>
  </header>

  <main class="config-container">

    <nav class="config-menu">
      <ul>
        <li class="active" onclick="mostrarSeccion('privacidad', this)"><img src="icono-privacidad.png" class="icono" />Privacidad</li>
        <li onclick="mostrarSeccion('apariencia', this)"><img src="icono-tema.png" class="icono" />Apariencia</li>
        <li onclick="mostrarSeccion('cuenta', this)"><img src="icono-usuario.png" class="icono" />Cuenta</li>
        <li onclick="mostrarSeccion('sistema', this)"><img src="icono-sistema.png" class="icono" />Sistema</li>
      </ul>
    </nav>

    <section class="config-content">
      <div id="privacidad" class="config-block active">
        <h3>Privacidad y seguridad</h3>
        <p>🛡 Borrar historial de navegación</p>
        <p>🔒 Controlar el acceso a cookies y datos de sitios</p>
        <p>👁 Revisar permisos (ubicación, cámara, notificaciones)</p>
      </div>

      <div id="apariencia" class="config-block">
        <h3>Apariencia</h3>
        <p>🎨 Tema visual: Oscuro / Claro</p>
        <p>🔤 Fuente del sitio</p>
        <p>🔲 Tamaño de interfaz</p>
      </div>

      <div id="cuenta" class="config-block">
        <h3>Cuenta</h3>
        <p>👤 Cambiar nombre de usuario</p>
        <p>📧 Cambiar correo electrónico</p>
        <p>🔑 Cambiar contraseña</p>
      </div>

      <div id="sistema" class="config-block">
        <h3>Sistema</h3>
        <p>⚙ Ajustes de rendimiento</p>
        <p>📊 Información del dispositivo</p>
        <p>⏻ Reiniciar configuración</p>
      </div>
    </section>

  </main>

  <footer class="pie">
    <div>© 2025 - Todos los derechos reservados</div>
    <div class="redes">
      <a href="#"><img src="icono-facebook.png" alt="Facebook"></a>
      <a href="#"><img src="icono-instagram.png" alt="Instagram"></a>
      <a href="#"><img src="icono-twitter.png" alt="Twitter"></a>
    </div>
  </footer>

  <script>
    function mostrarSeccion(id, elemento) {
      // Ocultar todos los bloques
      document.querySelectorAll('.config-block').forEach(b => b.classList.remove('active'));
      // Mostrar el bloque elegido
      document.getElementById(id).classList.add('active');

      // Quitar estado activo del menú
      document.querySelectorAll('.config-menu li').forEach(li => li.classList.remove('active'));
      // Activar el seleccionado
      elemento.classList.add('active');
    }
  </script>
</body>
</html>
