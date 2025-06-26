document.addEventListener('DOMContentLoaded', function() {
            
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    let currentSlideIndex = 0;
    let isAnimating = false; 
    
    const currentSlideElement = document.getElementById('current-slide');
    const totalSlidesElement = document.getElementById('total-slides');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    totalSlidesElement.textContent = totalSlides;
    
    function showSlide(newIndex) {
        if (isAnimating || newIndex === currentSlideIndex) return;
        
        if (newIndex >= totalSlides) {
            newIndex = 0;
        }
        if (newIndex < 0) {
            newIndex = totalSlides - 1;
        }
        
        isAnimating = true;
        
        const oldSlide = slides[currentSlideIndex];
        const newSlide = slides[newIndex];
        
        
        oldSlide.classList.add('exiting');
        oldSlide.classList.remove('active');
        
        
        setTimeout(() => {
            oldSlide.classList.remove('exiting');
            newSlide.classList.add('active');
            currentSlideIndex = newIndex;
            currentSlideElement.textContent = currentSlideIndex + 1;
            isAnimating = false;
        }, 800);
    }
    
    prevBtn.addEventListener('click', () => showSlide(currentSlideIndex - 1));
    nextBtn.addEventListener('click', () => showSlide(currentSlideIndex + 1));
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            showSlide(currentSlideIndex - 1);
        } else if (e.key === 'ArrowRight') {
            showSlide(currentSlideIndex + 1);
        } else if (e.key === 'Home') {
            showSlide(0);
        }
    });
    
   
    const starfield = document.getElementById('starfield');
    for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.classList.add('particle');
        const size = Math.random() * 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animation = `twinkle ${Math.random() * 5 + 2}s infinite alternate`;
        starfield.appendChild(star);
    }
    
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        const size = Math.random() * 8 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animation = `float ${Math.random() * 20 + 10}s infinite linear`;
        document.body.appendChild(particle);
    }
    
    
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');

    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.pageX + 'px';
        cursor.style.top = e.pageY + 'px';

     setTimeout(() => {
     cursorFollower.style.left = e.pageX + 'px';
        cursorFollower.style.top = e.pageY + 'px';
    }, 100);
    });
    
    document.querySelectorAll('button, .list-item, .highlight').forEach(item => {
        item.addEventListener('mouseenter', () => {
            cursor.classList.add('cursor-active');
        });
        
        item.addEventListener('mouseleave', () => {
            cursor.classList.remove('cursor-active');
        });
    });
    
   
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth / 2 - e.clientX) / 50;
        const y = (window.innerHeight / 2 - e.clientY) / 50;
        document.body.style.backgroundPosition = `${x}px ${y}px`;
    });
    
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.boxShadow = '0 0 15px rgba(144, 224, 239, 0.7)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.boxShadow = '';
        });
    });
});