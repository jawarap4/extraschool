// app.js content
// ============================================
// COMPATIBILITY FIXES
// ============================================

// Polyfill untuk Object.assign jika diperlukan
if (typeof Object.assign !== 'function') {
    Object.assign = function(target, varArgs) {
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        
        var to = Object(target);
        
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];
            
            if (nextSource != null) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

// Polyfill untuk Array.find jika diperlukan
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;
        
        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

// ============================================
// MAIN APPLICATION
// ============================================
class SekolahPortal {
    constructor() {
        this.currentPage = 'home';
        this.isLoading = true;
        
        // Data storage
        this.carouselData = [];
        this.worksData = [];
        this.newsData = [];
        
        // Gunakan auth system jika ada
        this.auth = window.authSystem || null;
        this.currentUser = this.auth ? this.auth.currentUser : null;
        
        // Initialize
        this.bindEvents();
        
        // Prevent multiple instances
        if (window.SekolahPortalInstance) {
            return window.SekolahPortalInstance;
        }
        window.SekolahPortalInstance = this;
        
        this.init();
    }

    bindEvents() {
        // Global event delegation
        document.addEventListener('click', (e) => {
            // Login button
            if (e.target.classList.contains('btn-login') || 
                e.target.closest('.btn-login')) {
                if (this.auth && this.auth.showLoginModal) {
                    this.auth.showLoginModal();
                } else {
                    this.showLoginModal();
                }
            }
            
            // Logout button
            if (e.target.classList.contains('btn-logout') || 
                e.target.closest('.btn-logout')) {
                this.handleLogout();
            }
            
            // Navigation links
            if (e.target.classList.contains('nav-link')) {
                e.preventDefault();
                const page = e.target.getAttribute('href').replace('#', '');
                this.renderPage(page);
            }
            
            // See more button
            if (e.target.classList.contains('see-more-btn') || 
                e.target.closest('.see-more-btn')) {
                e.preventDefault();
                this.renderPage('gallery');
            }
        });

        // Listen to hash change for SPA navigation
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.replace('#', '') || 'home';
            this.renderPage(page);
        });
    }

    async init() {
        try {
            console.log('Initializing SekolahPortal...');
            
            // Initialize storage
            if (typeof storage !== 'undefined' && storage.init) {
                await storage.init();
            }
            
            // Check for existing user
            if (storage && storage.getCurrentUser) {
                this.currentUser = await storage.getCurrentUser();
            }
            
            // Load data
            await this.loadData();
            
            // Setup UI
            this.renderNavigation();
            
            // Check URL hash for initial page
            const initialPage = window.location.hash.replace('#', '') || 'home';
            this.renderPage(initialPage);
            
            this.hideLoading();
            console.log('Portal initialized successfully');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Gagal memuat aplikasi. Silahkan refresh halaman.');
            this.hideLoading();
        }
    }

    async loadData() {
        try {
            console.log('Loading data...');
            
            // Load from storage if available
            if (storage && storage.getItems) {
                this.carouselData = await storage.getItems('carousel') || [];
                this.worksData = await storage.getItems('works') || [];
                this.newsData = await storage.getItems('news') || [];
            }
            
            console.log(`Data loaded: ${this.carouselData.length} carousel, ${this.worksData.length} works, ${this.newsData.length} news`);
            
            // If no carousel data, create defaults
            if (this.carouselData.length === 0) {
                console.log('Creating default data...');
                await this.createDefaultData();
                // Reload data
                this.carouselData = await storage.getItems('carousel') || [];
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to empty arrays
            this.carouselData = [];
            this.worksData = [];
            this.newsData = [];
        }
    }

    async createDefaultData() {
        const defaultCarousel = [
            {
                id: 1,
                title: "Selamat Datang di Portal Sekolah Digital",
                description: "Platform terintegrasi untuk manajemen pendidikan modern",
                image: "https://via.placeholder.com/1200x400/4A90E2/FFFFFF?text=Portal+Sekolah+Digital",
                active: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                title: "Pembelajaran Interaktif",
                description: "Akses materi pembelajaran kapan saja, di mana saja",
                image: "https://via.placeholder.com/1200x400/06D6A0/FFFFFF?text=Pembelajaran+Digital",
                active: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                title: "Kolaborasi Komunitas",
                description: "Siswa, guru, dan orang tua dalam satu platform",
                image: "https://via.placeholder.com/1200x400/EF476F/FFFFFF?text=Kolaborasi+Sekolah",
                active: true,
                createdAt: new Date().toISOString()
            }
        ];

        const defaultUsers = [
            {
                id: 1,
                username: "admin@sekolah.id",
                email: "admin@sekolah.id",
                password: "admin123",
                name: "Administrator Sekolah",
                role: "admin"
            },
            {
                id: 2,
                username: "guru@sekolah.id",
                email: "guru@sekolah.id",
                password: "guru123",
                name: "Guru Matematika",
                role: "guru"
            },
            {
                id: 3,
                username: "ortu@sekolah.id",
                email: "ortu@sekolah.id",
                password: "ortu123",
                name: "Orang Tua Siswa",
                role: "ortu"
            }
        ];

        try {
            console.log('Adding default data to storage...');
            
            // Add to storage if available
            if (storage && storage.createItem) {
                for (const item of defaultCarousel) {
                    await storage.createItem('carousel', item);
                }
                
                // Check if users already exist
                const existingUsers = await storage.getItems('users') || [];
                if (existingUsers.length === 0) {
                    for (const user of defaultUsers) {
                        await storage.createItem('users', user);
                    }
                }
            }
            
            console.log('Default data created successfully');
        } catch (error) {
            console.error('Error creating default data:', error);
        }
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.transition = 'opacity 0.3s';
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }, 1000);
        }
        this.isLoading = false;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #EF476F;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(errorDiv);
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #06D6A0;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(successDiv);
        setTimeout(() => {
            successDiv.style.opacity = '0';
            setTimeout(() => successDiv.remove(), 300);
        }, 3000);
    }

    renderNavigation() {
        const headerNav = document.getElementById('headerNav');
        if (headerNav) {
            headerNav.innerHTML = `
                <div class="header-nav-container">
                    <div class="nav-brand">
                        <a href="#home" class="nav-link" style="color: inherit; text-decoration: none;">
                            <i class="fas fa-school"></i>
                            <span>Portal Sekolah</span>
                        </a>
                    </div>
                    <div class="nav-menu">
                        <a href="#home" class="nav-link ${this.currentPage === 'home' ? 'active' : ''}">
                            <i class="fas fa-home"></i> Beranda
                        </a>
                        <a href="#gallery" class="nav-link ${this.currentPage === 'gallery' ? 'active' : ''}">
                            <i class="fas fa-images"></i> Galeri
                        </a>
                        ${this.currentUser ? 
                            `<div class="user-menu">
                                <div class="user-profile">
                                    <div class="user-avatar">
                                        ${this.currentUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span class="user-name">${this.currentUser.name}</span>
                                </div>
                                ${this.currentUser.role === 'admin' ? 
                                    `<a href="#admin" class="nav-link">
                                        <i class="fas fa-cog"></i> Admin
                                    </a>` : ''
                                }
                                <button class="btn-logout">
                                    <i class="fas fa-sign-out-alt"></i> Logout
                                </button>
                            </div>` : 
                            `<button class="btn-login">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>`
                        }
                    </div>
                </div>
            `;
        }
    }

    renderPage(page) {
        this.currentPage = page;
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        console.log(`Rendering page: ${page}`);
        
        // Update navigation active state
        this.renderNavigation();
        
        switch(page) {
            case 'home':
                this.renderHome(mainContent);
                break;
            case 'gallery':
                this.renderGallery(mainContent);
                break;
            case 'admin':
                this.renderAdmin(mainContent);
                break;
            case 'profile':
                this.renderProfile(mainContent);
                break;
            default:
                mainContent.innerHTML = `
                    <div class="home-container">
                        <h2>Halaman ${page}</h2>
                        <p>Halaman ini belum tersedia.</p>
                        <a href="#home" class="btn-login">Kembali ke Beranda</a>
                    </div>
                `;
        }
        
        // Update URL hash without triggering navigation
        if (window.location.hash !== `#${page}`) {
            history.pushState(null, null, `#${page}`);
        }
    }

    renderHome(container) {
        // Get latest 2 works only
        const latestWorks = this.worksData
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 2);
        
        container.innerHTML = `
            <div class="home-container">
                <h1>Selamat Datang di Portal Sekolah Digital</h1>
                <p>Sistem terintegrasi untuk manajemen sekolah modern</p>
                
                ${!this.currentUser ? `
                <div class="login-prompt" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; margin: 30px 0; text-align: center;">
                    <h3><i class="fas fa-lock"></i> Login untuk Mengakses Fitur Lengkap</h3>
                    <p>Gunakan akun demo berikut:</p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px;">
                            <strong>Admin</strong><br>
                            admin@sekolah.id<br>
                            <small>admin123</small>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px;">
                            <strong>Guru</strong><br>
                            guru@sekolah.id<br>
                            <small>guru123</small>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px;">
                            <strong>Orang Tua</strong><br>
                            ortu@sekolah.id<br>
                            <small>ortu123</small>
                        </div>
                    </div>
                    <button class="btn-login" style="margin-top: 20px; background: white; color: #667eea; font-size: 1.1rem; padding: 12px 30px;">
                        <i class="fas fa-sign-in-alt"></i> Klik di sini untuk Login
                    </button>
                </div>
                ` : ''}
                
                <!-- Carousel -->
                <div id="carouselContainer"></div>
                
                <!-- Features -->
                <div class="features">
                    <div class="feature-card">
                        <i class="fas fa-graduation-cap"></i>
                        <h3>Pembelajaran Digital</h3>
                        <p>Akses materi pembelajaran kapan saja, di mana saja</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-users"></i>
                        <h3>Kolaborasi Siswa</h3>
                        <p>Berbagi karya dan berkolaborasi dalam project</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-newspaper"></i>
                        <h3>Informasi Terkini</h3>
                        <p>Update berita dan informasi sekolah terbaru</p>
                    </div>
                </div>
                
                <!-- Latest Works (Limited to 2) -->
                <div class="section-header">
                    <h2><i class="fas fa-paint-brush"></i> Karya Terbaru Siswa</h2>
                    ${this.worksData.length > 2 ? `
                        <a href="#gallery" class="see-more-btn">
                            Lihat Selengkapnya <i class="fas fa-arrow-right"></i>
                        </a>
                    ` : ''}
                </div>
                
                <div class="works-grid">
                    ${latestWorks.length > 0 ? latestWorks.map(work => `
                        <div class="work-card">
                            <div class="work-image">
                                <img src="${work.image || this.getWorkPlaceholder()}" 
                                     alt="${work.title}"
                                     loading="lazy">
                                <div class="work-overlay">
                                    <div class="work-stats">
                                        <span><i class="fas fa-heart"></i> ${work.likes || 0}</span>
                                        <span><i class="fas fa-eye"></i> ${work.views || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="work-info">
                                <h4>${work.title}</h4>
                                <p class="work-author">
                                    <i class="fas fa-user"></i> ${work.student || 'Siswa'}
                                    ${work.class ? `<span class="work-class">${work.class}</span>` : ''}
                                </p>
                                <p class="work-desc">${work.description || ''}</p>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-works" style="grid-column: 1 / -1; text-align: center; padding: 40px; background: #f8f9fa; border-radius: 10px;">
                            <i class="fas fa-paint-brush" style="font-size: 3rem; color: #adb5bd; margin-bottom: 15px;"></i>
                            <p>Belum ada karya siswa yang diunggah</p>
                        </div>
                    `}
                </div>
                
                <!-- Latest News (Limited to 2) -->
                <div class="section-header">
                    <h2><i class="fas fa-newspaper"></i> Berita Terbaru</h2>
                    ${this.newsData.length > 2 ? `
                        <a href="#news" class="see-more-btn">
                            Lihat Selengkapnya <i class="fas fa-arrow-right"></i>
                        </a>
                    ` : ''}
                </div>
                
                <div class="news-list">
                    ${this.newsData.slice(0, 2).map(news => `
                        <div class="news-card">
                            <div class="news-date">
                                <span class="day">${new Date(news.createdAt || new Date()).getDate()}</span>
                                <span class="month">${this.getMonthName(new Date(news.createdAt || new Date()).getMonth())}</span>
                            </div>
                            <div class="news-content">
                                <h4>${news.title || 'Berita'}</h4>
                                <p>${news.description || ''}</p>
                                <div class="news-meta">
                                    <span><i class="fas fa-user"></i> ${news.author || 'Admin'}</span>
                                    <span><i class="fas fa-clock"></i> ${news.readTime || '2 min'}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${this.currentUser ? `
                    <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                        <h3>Selamat datang kembali, ${this.currentUser.name}!</h3>
                        <p>Role: <span class="user-role">${this.currentUser.role}</span></p>
                        <p>Silakan jelajahi fitur-fitur portal.</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Initialize carousel
        if (this.carouselData && this.carouselData.length > 0) {
            setTimeout(() => {
                this.initCarousel();
            }, 100);
        }
    }

    initCarousel() {
        const container = document.getElementById('carouselContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="carousel">
                <div class="carousel-track">
                    ${this.carouselData.map((item, index) => `
                        <div class="carousel-slide ${index === 0 ? 'active' : ''}" 
                             data-index="${index}">
                            <img src="${item.image || this.getPlaceholder(item.title)}" 
                                 alt="${item.title}"
                                 loading="lazy">
                            <div class="carousel-caption">
                                <h3>${item.title}</h3>
                                ${item.description ? `<p>${item.description}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Dots Navigation -->
                <div class="carousel-dots">
                    ${this.carouselData.map((_, index) => `
                        <button class="carousel-dot ${index === 0 ? 'active' : ''}" 
                                data-index="${index}"
                                aria-label="Go to slide ${index + 1}"></button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Setup carousel functionality
        this.setupCarousel();
    }

    setupCarousel() {
        let currentIndex = 0;
        const slides = document.querySelectorAll('.carousel-slide');
        const dots = document.querySelectorAll('.carousel-dot');
        const track = document.querySelector('.carousel-track');
        
        if (slides.length <= 1) return;
        
        // Function to go to slide
        const goToSlide = (index) => {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;
            
            currentIndex = index;
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            // Update active states
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === currentIndex);
            });
            
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        };
        
        // Dot navigation
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                goToSlide(index);
            });
        });
        
        // Auto-play
        let interval = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, 5000);
        
        // Pause on hover
        const carousel = document.querySelector('.carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => {
                clearInterval(interval);
            });
            
            carousel.addEventListener('mouseleave', () => {
                interval = setInterval(() => {
                    goToSlide(currentIndex + 1);
                }, 5000);
            });
        }
    }

    getPlaceholder(title) {
        const colors = ['4A90E2', '06D6A0', 'EF476F', 'FFD166'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const text = encodeURIComponent(title.substring(0, 20));
        return `https://via.placeholder.com/1200x400/${color}/FFFFFF?text=${text}`;
    }

    getWorkPlaceholder() {
        const colors = ['4A90E2', '06D6A0', 'EF476F', 'FFD166'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const texts = ['Karya Siswa', 'Seni Digital', 'Kreativitas', 'Inovasi'];
        const text = texts[Math.floor(Math.random() * texts.length)];
        return `https://via.placeholder.com/400x300/${color}/FFFFFF?text=${encodeURIComponent(text)}`;
    }

    getMonthName(month) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return months[month];
    }

    renderGallery(container) {
        // Redirect to gallery.html or render inline
        container.innerHTML = `
            <div class="home-container">
                <h1><i class="fas fa-images"></i> Galeri Karya Siswa</h1>
                <p>Kumpulan kreativitas dan inovasi siswa dalam pembelajaran</p>
                
                <div class="gallery-redirect">
                    <div style="text-align: center; padding: 50px 20px;">
                        <i class="fas fa-external-link-alt" style="font-size: 4rem; color: #4A90E2; margin-bottom: 20px;"></i>
                        <h3>Galeri Lengkap Tersedia di Halaman Terpisah</h3>
                        <p>Klik tombol di bawah untuk membuka galeri lengkap dengan fitur pencarian dan filter.</p>
                        <a href="gallery.html" class="btn-login" style="margin-top: 20px; display: inline-block;">
                            <i class="fas fa-external-link-alt"></i> Buka Halaman Galeri
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    renderAdmin(container) {
        // Check if user is admin
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            container.innerHTML = `
                <div class="home-container">
                    <h2>Akses Ditolak</h2>
                    <p>Hanya admin yang bisa mengakses halaman ini.</p>
                    <a href="#home" class="btn-login">Kembali ke Beranda</a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="admin-container">
                <h1><i class="fas fa-cog"></i> Panel Admin</h1>
                <p>Kelola data portal sekolah</p>
                
                <div class="admin-nav">
                    <a href="#home">Beranda</a>
                    <a href="#admin" class="active">Admin Panel</a>
                </div>
                
                <div class="admin-stats">
                    <div class="stat-card">
                        <div class="stat-number">${this.carouselData.length}</div>
                        <div class="stat-label">Carousel</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.worksData.length}</div>
                        <div class="stat-label">Karya Siswa</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.newsData.length}</div>
                        <div class="stat-label">Berita</div>
                    </div>
                </div>
                
                <div id="adminContent">
                    <p>Memuat admin panel...</p>
                </div>
            </div>
        `;

        // Load admin panel
        this.loadAdminPanel();
    }

    async loadAdminPanel() {
        try {
            // Check if admin.js exists
            const adminContent = document.getElementById('adminContent');
            
            adminContent.innerHTML = `
                <div class="admin-section">
                    <h2><i class="fas fa-images"></i> Carousel</h2>
                    <button class="btn-add" data-type="carousel">
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                    ${this.renderAdminTable('carousel', this.carouselData)}
                </div>
                
                <div class="admin-section">
                    <h2><i class="fas fa-paint-brush"></i> Karya Siswa</h2>
                    <button class="btn-add" data-type="works">
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                    ${this.renderAdminTable('works', this.worksData)}
                </div>
                
                <div class="admin-section">
                    <h2><i class="fas fa-newspaper"></i> Berita</h2>
                    <button class="btn-add" data-type="news">
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                    ${this.renderAdminTable('news', this.newsData)}
                </div>
            `;
            
            // Setup admin events
            this.setupAdminEvents();
            
        } catch (error) {
            console.error('Error loading admin panel:', error);
            document.getElementById('adminContent').innerHTML = `
                <div class="error-message">
                    <p>Gagal memuat admin panel: ${error.message}</p>
                </div>
            `;
        }
    }

    renderAdminTable(type, items) {
        if (items.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Tidak ada data ${type}</p>
                </div>
            `;
        }

        return `
            <div class="table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th width="80">ID</th>
                            <th>Judul</th>
                            <th width="150">Tanggal</th>
                            <th width="120">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.id || '-'}</td>
                                <td>
                                    <strong>${item.title || 'Tidak ada judul'}</strong>
                                    ${item.description ? `<br><small>${item.description.substring(0, 50)}...</small>` : ''}
                                </td>
                                <td>
                                    ${item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}
                                </td>
                                <td>
                                    <button class="btn-delete" data-id="${item.id}" data-type="${type}">
                                        <i class="fas fa-trash"></i> Hapus
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    setupAdminEvents() {
        // Delete button events
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.closest('button').dataset.id;
                const type = e.target.closest('button').dataset.type;
                
                if (confirm('Yakin ingin menghapus data ini?')) {
                    try {
                        if (storage && storage.deleteItem) {
                            await storage.deleteItem(type, id);
                            this.showSuccess('Data berhasil dihapus');
                            // Reload data
                            await this.loadData();
                            this.renderAdmin(document.getElementById('mainContent'));
                        }
                    } catch (error) {
                        this.showError('Gagal menghapus data: ' + error.message);
                    }
                }
            });
        });
        
        // Add button events
        document.querySelectorAll('.btn-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.closest('button').dataset.type;
                this.showAddForm(type);
            });
        });
    }

    showAddForm(type) {
        const formHtml = `
            <div class="modal active" id="addModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Tambah ${type}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addForm">
                            <div class="form-group">
                                <label>Judul</label>
                                <input type="text" name="title" required>
                            </div>
                            <div class="form-group">
                                <label>Deskripsi</label>
                                <textarea name="description"></textarea>
                            </div>
                            ${type === 'carousel' ? `
                            <div class="form-group">
                                <label>Gambar URL</label>
                                <input type="text" name="image" placeholder="https://example.com/image.jpg">
                            </div>
                            ` : ''}
                            ${type === 'works' ? `
                            <div class="form-group">
                                <label>Nama Siswa</label>
                                <input type="text" name="student">
                            </div>
                            <div class="form-group">
                                <label>Kelas</label>
                                <input type="text" name="class">
                            </div>
                            ` : ''}
                            <button type="submit" class="btn-primary">Simpan</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', formHtml);
        
        // Setup form
        document.getElementById('addForm').onsubmit = async (e) => {
            e.preventDefault();
            await this.handleAddForm(type, e.target);
        };
        
        // Close button
        document.querySelector('#addModal .modal-close').onclick = () => {
            document.getElementById('addModal').remove();
        };
    }

    async handleAddForm(type, form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            if (storage && storage.createItem) {
                data.createdAt = new Date().toISOString();
                await storage.createItem(type, data);
                this.showSuccess('Data berhasil ditambahkan');
                document.getElementById('addModal').remove();
                // Reload data
                await this.loadData();
                this.renderAdmin(document.getElementById('mainContent'));
            }
        } catch (error) {
            this.showError('Gagal menambahkan data: ' + error.message);
        }
    }

    renderProfile(container) {
        container.innerHTML = `
            <div class="home-container">
                <h1>Profil Pengguna</h1>
                ${this.currentUser ? `
                    <div style="margin-top: 20px;">
                        <p><strong>Nama:</strong> ${this.currentUser.name}</p>
                        <p><strong>Role:</strong> ${this.currentUser.role}</p>
                        <p><strong>Email:</strong> ${this.currentUser.email}</p>
                    </div>
                ` : '<p>Silakan login untuk melihat profil</p>'}
            </div>
        `;
    }

    showLoginModal() {
        const modalHtml = `
            <div class="modal active" id="loginModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Login Portal</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="loginForm">
                            <div style="margin: 20px 0;">
                                <input type="email" id="loginEmail" placeholder="Email" 
                                       style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
                                <input type="password" id="loginPassword" placeholder="Password" 
                                       style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
                            </div>
                            <div id="loginMessage" style="color: red; margin: 10px 0;"></div>
                            <button type="submit" 
                                    style="background: #4A90E2; color: white; border: none; padding: 12px 30px; border-radius: 5px; cursor: pointer; width: 100%;">
                                Login
                            </button>
                            <p style="margin-top: 15px; color: #666;">
                                <small>Demo users:<br>
                                admin@sekolah.id / admin123<br>
                                guru@sekolah.id / guru123<br>
                                ortu@sekolah.id / ortu123</small>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Setup form
        document.getElementById('loginForm').onsubmit = async (e) => {
            e.preventDefault();
            await this.handleLogin();
        };
        
        // Close button
        document.querySelector('#loginModal .modal-close').onclick = () => {
            document.getElementById('loginModal').remove();
        };
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const messageDiv = document.getElementById('loginMessage');
        
        if (!email || !password) {
            messageDiv.textContent = 'Email dan password harus diisi';
            return;
        }
        
        try {
            if (storage && storage.login) {
                const user = await storage.login(email, password);
                this.currentUser = user;
                this.showSuccess(`Login berhasil! Selamat datang ${user.name}`);
                document.getElementById('loginModal').remove();
                this.renderNavigation();
                this.renderPage(this.currentPage);
            } else {
                // Fallback to simple check
                const users = [
                    { email: 'admin@sekolah.id', password: 'admin123', name: 'Administrator', role: 'admin' },
                    { email: 'guru@sekolah.id', password: 'guru123', name: 'Guru Demo', role: 'guru' },
                    { email: 'ortu@sekolah.id', password: 'ortu123', name: 'Orang Tua Demo', role: 'ortu' }
                ];
                
                const user = users.find(u => u.email === email && u.password === password);
                if (user) {
                    this.currentUser = { email: user.email, name: user.name, role: user.role };
                    this.showSuccess(`Login berhasil! Selamat datang ${user.name}`);
                    document.getElementById('loginModal').remove();
                    this.renderNavigation();
                    this.renderPage(this.currentPage);
                    
                    // Save to localStorage
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                } else {
                    throw new Error('Email atau password salah');
                }
            }
        } catch (error) {
            messageDiv.textContent = error.message;
        }
    }

    async handleLogout() {
        try {
            if (storage && storage.logout) {
                await storage.logout();
            } else {
                localStorage.removeItem('currentUser');
            }
            
            this.currentUser = null;
            this.showSuccess('Logout berhasil!');
            this.renderNavigation();
            this.renderPage('home');
        } catch (error) {
            this.showError('Gagal logout: ' + error.message);
        }
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Loaded - Initializing app...');
    
    // Test localStorage
    if (!window.localStorage) {
        alert('Browser Anda tidak mendukung localStorage. Aplikasi tidak dapat berjalan.');
        return;
    }
    
    // Create app instance
    if (!window.app) {
        try {
            window.app = new SekolahPortal();
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            
            // Fallback minimal UI
            const mainContent = document.getElementById('mainContent');
            const loadingScreen = document.getElementById('loadingScreen');
            
            if (mainContent) {
                mainContent.innerHTML = `
                    <div style="padding: 50px; text-align: center;">
                        <h1>Portal Sekolah</h1>
                        <p>Terjadi error dalam aplikasi. Silakan refresh halaman.</p>
                        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">
                            Refresh
                        </button>
                    </div>
                `;
            }
            
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }
    }
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global Error:', e.error);
    console.error('File:', e.filename);
    console.error('Line:', e.lineno);
});