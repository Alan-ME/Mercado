<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Login</title>
  <link rel="stylesheet" href="login.css" />
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

  <main class="contenedor">
    <div class="izquierda">
      <h1>Ingresá tu e-mail o teléfono<br>para iniciar sesión</h1>
    </div>

    <div class="derecha">
      <form action="php/login_usuario_be.php" class="formulario" method="POST">
        <label for="usuario">Usuario</label>
        <input id="usuario" type="text" name="usuario" required/>
        <label for="contrasena">Contraseña</label>
        <input id="contrasena" type="password" name="contrasena" required/>
        <button class="continuar" type="submit">
          <span class="blinking">▌</span> Continuar
        </button>

        <a href="Registro.php" class="crear-cuenta">Crear cuenta</a>

        <div class="separador">
          <hr /><span>o</span><hr />
        </div>

        <button class="google-btn" type="button">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" />
          Iniciar sesión con Google
        </button>
      </form>
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
