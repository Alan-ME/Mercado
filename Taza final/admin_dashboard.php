<?php
session_start();
if (!isset($_SESSION['usuario']) || $_SESSION['rol'] !== 'admin') {
    header("Location: index.php");
    exit();
}

include "php/conexion_be.php";

if (isset($_GET['eliminar'])) {
    $id_eliminar = intval($_GET['eliminar']);
    mysqli_query($conexion, "DELETE FROM accountr WHERE id = $id_eliminar");
    header("Location: admin_dashboard.php");
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['editar_id'])) {
    $id_editar = intval($_POST['editar_id']);
    $nombre_completo = $_POST['nombre_completo'];
    $correo = $_POST['correo'];
    $usuario_input = $_POST['usuario'];
    $contrasena = $_POST['contrasena'];

    mysqli_query($conexion, "
        UPDATE accountr SET
            nombre_completo = '$nombre_completo',
            correo = '$correo',
            usuario = '$usuario_input',
            contrasena = '$contrasena'
        WHERE id = $id_editar
    ");
    header("Location: admin_dashboard.php");
    exit();
}

$usuarios = mysqli_query($conexion, "SELECT * FROM accountr");
$usuario_editar = null;

if (isset($_GET['editar'])) {
    $id_editar = intval($_GET['editar']);
    $res = mysqli_query($conexion, "SELECT * FROM accountr WHERE id = $id_editar");
    if (mysqli_num_rows($res) > 0) {
        $usuario_editar = mysqli_fetch_assoc($res);
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Panel de Administración</title>
    <link rel="stylesheet" href="admin_dashboard.css">
</head>
<body>

    <header class="encabezado">
        <a href="index.php" style="text-decoration: none; color: inherit;">
        <div class="titulo">Panel de Administración</div>
        <nav>
            <a href="index.php">Inicio</a>
            <a href="logout.php">Cerrar sesión</a>
        </nav>
    </header>

    <main>
        <h1 class="titulo-central">Usuarios Registrados</h1>

        <?php if ($usuario_editar): ?>
            <div class="form-card">
                <h2>Editar Usuario</h2>
                <form method="POST" class="formulario">
                    <input type="hidden" name="editar_id" value="<?= $usuario_editar['id'] ?>">
                    <label>Nombre completo:</label>
                    <input type="text" name="nombre_completo" value="<?= htmlspecialchars($usuario_editar['nombre_completo']) ?>" required>
                    <label>Correo:</label>
                    <input type="email" name="correo" value="<?= htmlspecialchars($usuario_editar['correo']) ?>" required>
                    <label>Usuario:</label>
                    <input type="text" name="usuario" value="<?= htmlspecialchars($usuario_editar['usuario']) ?>" required>
                    <label>Contraseña:</label>
                    <input type="text" name="contrasena" value="<?= htmlspecialchars($usuario_editar['contrasena']) ?>" required>
                    <button type="submit" class="continuar">Guardar Cambios</button>
                </form>
            </div>
        <?php endif; ?>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre completo</th>
                        <th>Correo</th>
                        <th>Usuario</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while ($row = mysqli_fetch_assoc($usuarios)) { ?>
                        <tr>
                            <td><?= $row['id'] ?></td>
                            <td><?= htmlspecialchars($row['nombre_completo']) ?></td>
                            <td><?= htmlspecialchars($row['correo']) ?></td>
                            <td><?= htmlspecialchars($row['usuario']) ?></td>
                            <td class="acciones">
                                <a href="?editar=<?= $row['id'] ?>">Editar</a>
                                <a href="?eliminar=<?= $row['id'] ?>" onclick="return confirm('¿Seguro que deseas eliminar este usuario?');">Eliminar</a>
                            </td>
                        </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>
    </main>

    <footer>
        <p>&copy; <?= date('Y') ?> Panel de Administración</p>
    </footer>

</body>
</html>
