<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Login</title>
  <link rel="stylesheet" href="register.css" />
</head>
<body>
  <header>
    <div class="arriba">
        <h1 class="titulo">
          <a href="index.php" style="text-decoration: none; color: inherit;">
          <span class="blanco">La Taza</span> <span class="oro">Noble</span>
          </a>
        </h1>
    </div>
  </header>

  <main class="registro-container">
  <div class="registro-box">
    <h2 class="registro-titulo">Te damos la bienvenida a <span class="oro">La Taza Noble</span></h2>
    <p class="registro-subtitulo">Registrate para comenzar</p>

    <form action="php/registro_usuario_be.php" method="POST" class="registro-formulario">
      <label for="nombre">Nombre completo</label>
      <input id="nombre" type="text" placeholder="Nombre completo" name="nombre_completo" required />

      <label for="correo">Correo electrónico</label>
      <input id="correo" type="email" placeholder="Correo electrónico" name="correo" required />

      <label for="usuario">Nombre de usuario</label>
      <input id="usuario" type="text" placeholder="Usuario" name="usuario" required />

      <label for="contrasena">Contraseña</label>
      <input id="contrasena" type="password" placeholder="Contraseña" name="contrasena" required />

      <button class="continuar" type="submit">
        Registrarse
      </button>

      <div class="separador">
        <hr /><span>o</span><hr />
      </div>

      <button class="google-btn" type="button">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" />
        Registrarse con Google
      </button>
    </form>

    <p class="crear-cuenta">¿Ya tenés cuenta? <a href="login.php">Iniciar sesión</a></p>
  </div>
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
</body>
</html>
