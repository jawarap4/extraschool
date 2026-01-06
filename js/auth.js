// auth.js content
// ============================================
// AUTHENTICATION SYSTEM
// ============================================
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : '';
        // Check mode from localStorage (default: mock)
        this.useAPI = localStorage.getItem('harfart_mode') === 'api';
        this.init();
    }

    init() {
        // Check for existing session
        this.checkExistingSession();
    }

    setMode(useAPI) {
        this.useAPI = useAPI;
        localStorage.setItem('harfart_mode', useAPI ? 'api' : 'mock');
        console.log(`Mode switched to: ${useAPI ? 'API Backend' : 'Mock (localStorage)'}`);
    }

    checkExistingSession() {
        const savedUser = localStorage.getItem('portal_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.dispatchAuthEvent('userLoggedIn', this.currentUser);
            } catch (e) {
                console.error('Error parsing saved user:', e);
                localStorage.removeItem('portal_user');
            }
        }
    }

    async login(email, password, role) {
        try {
            // Try API if enabled and backend available
            if (this.useAPI && this.apiBaseUrl) {
                try {
                    const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    const data = await response.json();
                    if (data.success && data.user) {
                        this.handleAuthSuccess(data.user);
                        return { success: true, user: data.user };
                    }
                } catch (apiError) {
                    console.warn('API login failed, falling back to mock:', apiError.message);
                }
            }

            // Local mock authentication
            const mockUsers = {
                'admin@sekolah.id': { password: 'admin123', role: 'admin', name: 'Administrator' },
                'guru@sekolah.id': { password: 'guru123', role: 'guru', name: 'Guru Contoh' },
                'ortu@sekolah.id': { password: 'ortu123', role: 'ortu', name: 'Orang Tua Contoh' }
            };

            const userRecord = mockUsers[email];
            if (userRecord && userRecord.password === password) {
                const user = {
                    email,
                    role: userRecord.role,
                    name: userRecord.name,
                    id: email.split('@')[0]
                };
                this.handleAuthSuccess(user);
                return { success: true, user };
            }

            // If not in hardcoded list, try users saved in localStorage
            const localUsersJSON = localStorage.getItem('harfart_users');
            if (localUsersJSON) {
                try {
                    const localUsers = JSON.parse(localUsersJSON);
                    const found = localUsers.find(u => u.email === email && u.password === password);
                    if (found) {
                        // Remove password from user object
                        const userWithoutPassword = {
                            id: found.id,
                            email: found.email,
                            name: found.name,
                            role: found.role
                        };
                        this.handleAuthSuccess(userWithoutPassword);
                        return { success: true, user: userWithoutPassword };
                    }
                } catch (err) {
                    console.warn('Failed to parse local users JSON', err);
                }
            }

            throw new Error('Email atau password salah');
        } catch (error) {
            console.error('Login error:', error);
            this.handleAuthError(error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            this.handleLogout();
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    handleAuthSuccess(user) {
        this.currentUser = user;
        
        // Save to localStorage
        localStorage.setItem('portal_user', JSON.stringify(user));
        
        // Dispatch event
        this.dispatchAuthEvent('userLoggedIn', user);
        
        // Log audit trail
        this.logAudit('LOGIN', 'User logged in', user);
        
        // Update UI
        this.updateUIAfterLogin();
    }

    handleAuthError(error) {
        console.error('Auth error:', error);
        this.showAuthError(error.message);
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('portal_user');
        
        // Dispatch event
        this.dispatchAuthEvent('userLoggedOut');
        
        // Log audit trail
        this.logAudit('LOGOUT', 'User logged out');
        
        // Update UI
        this.updateUIAfterLogout();
    }

    dispatchAuthEvent(eventName, detail = null) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    logAudit(action, description, user = null) {
        const auditEvent = new CustomEvent('auditLog', {
            detail: {
                action,
                description,
                user: user || this.currentUser,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(auditEvent);
    }

    updateUIAfterLogin() {
        // Update navigation or show user info
        const headerNav = document.querySelector('.header-nav-container');
        if (headerNav && this.currentUser) {
            // Add user profile to navigation
            const userElement = document.createElement('div');
            userElement.className = 'user-profile';
            userElement.innerHTML = `
                <div class="user-avatar">
                    ${this.currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span class="user-name">${this.currentUser.name}</span>
            `;
            headerNav.appendChild(userElement);
        }
        
        // Refresh the current page if it's the data siswa page
        if (window.app && window.app.currentPage === 'data-siswa') {
            window.app.renderPage('data-siswa');
        }
    }

    updateUIAfterLogout() {
        // Remove user profile from navigation
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.remove();
        }
        
        // Refresh the current page if it's the data siswa page
        if (window.app && window.app.currentPage === 'data-siswa') {
            window.app.renderPage('data-siswa');
        }
    }

    showAuthError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('active');
        } else {
            alert(`Error: ${message}`);
        }
    }

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (!modal) {
            this.createLoginModal();
        }
        
        const modalInstance = document.getElementById('loginModal');
        modalInstance.innerHTML = this.getLoginModalHTML();
        modalInstance.classList.add('active');
        
        this.setupLoginModalEvents();
    }

    createLoginModal() {
        const modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    getLoginModalHTML() {
        return `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-lock"></i> Login ke Portal</h2>
                    <button class="modal-close" id="closeLoginModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-danger d-none" id="loginError"></div>
                    
                    <div class="role-selector">
                        <button class="role-btn active" data-role="admin">
                            <i class="fas fa-user-shield"></i>
                            Admin
                        </button>
                        <button class="role-btn" data-role="guru">
                            <i class="fas fa-chalkboard-teacher"></i>
                            Guru
                        </button>
                        <button class="role-btn" data-role="ortu">
                            <i class="fas fa-user-friends"></i>
                            Orang Tua
                        </button>
                    </div>
                    
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="loginEmail">Email</label>
                            <input type="email" id="loginEmail" class="form-control" placeholder="email@sekolah.id" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="loginPassword">Password</label>
                            <input type="password" id="loginPassword" class="form-control" placeholder="Password" required>
                        </div>
                        
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary btn-lg w-100">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>
                        </div>
                    </form>
                    
                    <div class="text-center mt-3">
                        <p class="text-muted">Gunakan akun yang diberikan oleh sekolah</p>
                    </div>
                </div>
            </div>
        `;
    }

    setupLoginModalEvents() {
        // Close button
        document.getElementById('closeLoginModal').addEventListener('click', () => {
            document.getElementById('loginModal').classList.remove('active');
        });
        
        // Role selector
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Form submission
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const role = document.querySelector('.role-btn.active').dataset.role;
            
            await this.login(email, password, role);
            
            // Close modal on success
            if (this.currentUser) {
                document.getElementById('loginModal').classList.remove('active');
            }
        });
        
        // Close modal when clicking outside
        document.getElementById('loginModal').addEventListener('click', (e) => {
            if (e.target.id === 'loginModal') {
                e.target.classList.remove('active');
            }
        });
    }
}

// Create auth system instance (global)
const authSystem = new AuthSystem();
window.authSystem = authSystem;