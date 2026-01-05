// ============================================
// CUSTOM CAROUSEL COMPONENT
// ============================================
class CustomCarousel {
    constructor(containerId, data = []) {
        this.container = document.getElementById(containerId);
        this.data = data;
        this.currentIndex = 0;
        this.interval = null;
        this.autoPlay = true;
        this.speed = 5000; // 5 seconds
        
        if (this.container && this.data.length > 0) {
            this.init();
        }
    }

    init() {
        this.render();
        this.setupEvents();
        this.startAutoPlay();
    }

    render() {
        this.container.innerHTML = `
            <div class="carousel-container">
                <div class="carousel-track">
                    ${this.data.map((item, index) => `
                        <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                            <img src="${item.image || this.getPlaceholderImage(item.title)}" 
                                 alt="${item.title}"
                                 loading="lazy"
                                 onerror="this.src='${this.getPlaceholderImage(item.title)}'">
                            <div class="carousel-caption">
                                <h3>${item.title}</h3>
                                <p>${item.description || ''}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Dots Navigation -->
                <div class="carousel-dots">
                    ${this.data.map((_, index) => `
                        <div class="carousel-dot ${index === 0 ? 'active' : ''}" 
                             data-index="${index}"></div>
                    `).join('')}
                </div>
                
                <!-- Progress Bar -->
                <div class="carousel-progress">
                    <div class="carousel-progress-bar"></div>
                </div>
                
                <!-- Thumbnails (Optional) -->
                ${this.data.length > 1 ? `
                <div class="carousel-thumbnails">
                    ${this.data.map((item, index) => `
                        <div class="carousel-thumbnail ${index === 0 ? 'active' : ''}" 
                             data-index="${index}">
                            <img src="${item.image || this.getPlaceholderImage(item.title)}" 
                                 alt="${item.title}">
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;
        
        this.updatePosition();
    }

    getPlaceholderImage(title) {
        // Use placeholder service
        const colors = ['4A90E2', '06D6A0', 'EF476F', 'FFD166'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const text = encodeURIComponent(title.substring(0, 20));
        return `https://via.placeholder.com/1200x400/${color}/FFFFFF?text=${text}`;
    }

    setupEvents() {
        // Dot navigation
        this.container.querySelectorAll('.carousel-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.goToSlide(index);
                this.resetAutoPlay();
            });
        });

        // Thumbnail navigation
        this.container.querySelectorAll('.carousel-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.carousel-thumbnail').dataset.index);
                this.goToSlide(index);
                this.resetAutoPlay();
            });
        });

        // Touch/swipe support
        let startX = 0;
        this.container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        this.container.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) { // Minimum swipe distance
                if (diff > 0) {
                    this.nextSlide(); // Swipe left
                } else {
                    this.prevSlide(); // Swipe right
                }
                this.resetAutoPlay();
            }
        });

        // Pause on hover
        this.container.addEventListener('mouseenter', () => {
            this.pauseAutoPlay();
        });

        this.container.addEventListener('mouseleave', () => {
            this.resumeAutoPlay();
        });
    }

    goToSlide(index) {
        if (index < 0) index = this.data.length - 1;
        if (index >= this.data.length) index = 0;
        
        this.currentIndex = index;
        this.updatePosition();
        this.updateActiveStates();
    }

    nextSlide() {
        this.goToSlide(this.currentIndex + 1);
    }

    prevSlide() {
        this.goToSlide(this.currentIndex - 1);
    }

    updatePosition() {
        const track = this.container.querySelector('.carousel-track');
        if (track) {
            const slideWidth = 100; // Percentage
            track.style.transform = `translateX(-${this.currentIndex * slideWidth}%)`;
        }
        
        // Update progress bar
        const progressBar = this.container.querySelector('.carousel-progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
            setTimeout(() => {
                progressBar.style.width = '100%';
            }, 10);
        }
    }

    updateActiveStates() {
        // Update slides
        this.container.querySelectorAll('.carousel-slide').forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentIndex);
        });

        // Update dots
        this.container.querySelectorAll('.carousel-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });

        // Update thumbnails
        this.container.querySelectorAll('.carousel-thumbnail').forEach((thumb, index) => {
            thumb.classList.toggle('active', index === this.currentIndex);
        });
    }

    startAutoPlay() {
        if (this.autoPlay && this.data.length > 1) {
            this.interval = setInterval(() => {
                this.nextSlide();
            }, this.speed);
            
            // Start progress bar animation
            const progressBar = this.container.querySelector('.carousel-progress-bar');
            if (progressBar) {
                progressBar.style.transition = `width ${this.speed}ms linear`;
                progressBar.style.width = '100%';
            }
        }
    }

    pauseAutoPlay() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            
            // Pause progress bar
            const progressBar = this.container.querySelector('.carousel-progress-bar');
            if (progressBar) {
                const computedStyle = getComputedStyle(progressBar);
                const currentWidth = parseFloat(computedStyle.width);
                progressBar.style.transition = 'none';
                progressBar.style.width = currentWidth + '%';
            }
        }
    }

    resumeAutoPlay() {
        if (this.autoPlay && !this.interval) {
            this.startAutoPlay();
        }
    }

    resetAutoPlay() {
        this.pauseAutoPlay();
        this.resumeAutoPlay();
    }

    updateData(newData) {
        this.data = newData;
        this.currentIndex = 0;
        this.render();
        this.setupEvents();
        if (this.autoPlay) this.startAutoPlay();
    }

    destroy() {
        this.pauseAutoPlay();
        this.container.innerHTML = '';
    }
}