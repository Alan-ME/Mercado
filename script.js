document.addEventListener("DOMContentLoaded", function(){
    const modal = document.getElementById("loginModal");
    const boton1 = document.querySelector(".boton1");
    const closeBtn = document.querySelector(".close");

    modal.style.display = "none";

    function abrirModal() {
        modal.style.display = "flex";
    }

    boton1.addEventListener("click", abrirModal);


    window.addEventListener("click", function(event){
        if (event.target === modal){
            modal.style.display = "none";
        }
    });

});