<?php
session_start();
include 'conexion_be.php';

$usuario = $_POST['usuario'];
$contrasena = hash('sha512', $_POST['contrasena']);


$validar_login = mysqli_query($conexion, "SELECT * FROM accountr WHERE usuario='$usuario' AND contrasena='$contrasena'");

if (mysqli_num_rows($validar_login) > 0) {
    $datos = mysqli_fetch_array($validar_login);

    $_SESSION['usuario'] = $datos['usuario'];
    $_SESSION['rol'] = $datos['rol']; // Guardamos el rol

    // Redirigir según el rol
    if ($datos['rol'] === 'admin') {
        header("Location: ../index.php");
        exit;
    } else {
        header("Location: ../index.php");
        exit;
    }
} else {
    echo '
        <script>
            alert("Usuario no existe, por favor verifique los datos introducidos");
            window.location = "../login.php";
        </script>
    ';
    exit;
}
?>