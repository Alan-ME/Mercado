const carouselImages = document.querySelector('.carrusel-imagenes');
const images = document.querySelectorAll('.carrusel-imagenes img');
const prevBtn = document.querySelector('.antes');
const nextBtn = document.querySelector('.despues');
const dotsContainer = document.querySelector('.carrusel-puntos');

let index = 0;

images.forEach((_, i) => {
  const dot = document.createElement('span');
  dot.classList.add('dot');
  if (i === 0) dot.classList.add('active');
  dot.addEventListener('click', () => showImage(i));
  dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll('.dot');

function updateDots() {
  dots.forEach(dot => dot.classList.remove('active'));
  dots[index].classList.add('active');
}

function showImage(i) {
  index = (i + images.length) % images.length;
  carouselImages.style.transform = `translateX(-${index * 100}%)`;
  updateDots();
}

prevBtn.addEventListener('click', () => showImage(index - 1));
nextBtn.addEventListener('click', () => showImage(index + 1));

setInterval(() => showImage(index + 1), 6000);
