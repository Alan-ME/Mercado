document.addEventListener("DOMContentLoaded", function(){
    const modal = document.getElementById("loginModal");
    const boton1 = document.querySelector(".boton1");
    const boton2 = document.querySelector(".boton2");
    const boton3 = document.querySelector(".boton3");
    const boton4 = document.querySelector(".boton4");
    const boton5 = document.querySelector(".boton5");
    const boton6 = document.querySelector(".boton6");
    const closeBtn = document.querySelector(".close");

    modal.style.display = "none";

    function abrirModal() {
        modal.style.display = "flex";
    }

    boton1.addEventListener("click", abrirModal);
    boton2.addEventListener("click", abrirModal);
    boton3.addEventListener("click", abrirModal);
    boton4.addEventListener("click", abrirModal);
    boton5.addEventListener("click", abrirModal);
    boton6.addEventListener("click", abrirModal);


    window.addEventListener("click", function(event){
        if (event.target === modal){
            modal.style.display = "none";
        }
    });

});