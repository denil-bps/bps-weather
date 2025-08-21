// Authentication service for BPS Weather App (Mock implementation for static site)
window.AuthService = {
    // Current user state
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    
    // Initialize authentication
    init() {
        this.isLoading = false; // Don't show loading initially
        
        // Check for existing authentication
        const token = window.StorageManager.auth.getToken();
        const profile = window.StorageManager.profile.get();
        
        if (token && window.StorageManager.auth.isValidToken() && profile) {
            this.currentUser = profile;
            this.isAuthenticated = true;
            console.log('User authenticated from storage:', profile.email);
        } else {
            // Make sure we show unauthenticated state
            this.currentUser = null;
            this.isAuthenticated = false;
        }
        
        this.updateUI();
        
        return Promise.resolve(this.currentUser);
    },
    
    // Mock login (simulates authentication)
    async login(email = null, password = null) {
        this.isLoading = true;
        this.updateUI();
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
            // For demo purposes, create a mock user
            const mockUser = {
                id: `user_${Date.now()}`,
                email: email || 'student@bps.edu.in',
                firstName: 'Student',
                lastName: 'User',
                profileImageUrl: '',
                preferences: {
                    tempUnit: 'celsius',
                    notifications: true,
                    theme: 'light'
                },
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            
            // Save to storage
            const token = `mock_token_${Date.now()}`;
            window.StorageManager.auth.setToken(token);
            window.StorageManager.profile.set(mockUser);
            
            this.currentUser = mockUser;
            this.isAuthenticated = true;
            this.isLoading = false;
            
            this.updateUI();
            this.showSuccessMessage('Successfully signed in!');
            
            return mockUser;
            
        } catch (error) {
            this.isLoading = false;
            this.updateUI();
            this.showErrorMessage('Login failed. Please try again.');
            throw error;
        }
    },
    
    // Logout
    async logout() {
        this.isLoading = true;
        this.updateUI();
        
        // Clear authentication data
        window.StorageManager.auth.clearToken();
        window.StorageManager.profile.clear();
        
        this.currentUser = null;
        this.isAuthenticated = false;
        this.isLoading = false;
        
        this.updateUI();
        this.showSuccessMessage('Successfully signed out!');
        
        // Redirect to home and close any open menus
        window.AppComponents.switchTab('home');
        
        return Promise.resolve();
    },
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },
    
    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated && this.currentUser !== null;
    },
    
    // Update user profile
    async updateProfile(updates) {
        if (!this.isAuthenticated) {
            throw new Error('User not authenticated');
        }
        
        const updatedUser = {
            ...this.currentUser,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        window.StorageManager.profile.set(updatedUser);
        this.currentUser = updatedUser;
        this.updateUI();
        
        return updatedUser;
    },
    
    // Update user preferences
    async updatePreferences(preferences) {
        if (!this.isAuthenticated) {
            throw new Error('User not authenticated');
        }
        
        const updatedPreferences = {
            ...this.currentUser.preferences,
            ...preferences
        };
        
        const updatedUser = await this.updateProfile({
            preferences: updatedPreferences
        });
        
        // Also update app settings
        window.StorageManager.settings.update(preferences);
        
        return updatedUser;
    },
    
    // Update UI based on authentication state
    updateUI() {
        const authBtn = document.getElementById('auth-btn');
        const userMenu = document.getElementById('user-menu');
        const tabNav = document.getElementById('tab-navigation');
        
        if (this.isLoading) {
            // Show loading state
            if (authBtn) {
                authBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i><span>Loading...</span>';
                authBtn.disabled = true;
            }
            return;
        }
        
        if (this.isAuthenticated && this.currentUser) {
            // Show authenticated UI
            if (authBtn) {
                authBtn.classList.add('hidden');
            }
            
            if (userMenu) {
                userMenu.classList.remove('hidden');
                this.updateUserMenuInfo();
            }
            
            if (tabNav) {
                tabNav.classList.remove('hidden');
            }
            
            // Show add to favorites buttons
            const favoriteButtons = document.querySelectorAll('.favorite-btn');
            favoriteButtons.forEach(btn => btn.classList.remove('hidden'));
            
        } else {
            // Show unauthenticated UI
            if (authBtn) {
                authBtn.classList.remove('hidden');
                authBtn.innerHTML = '<i data-lucide="user"></i><span>Sign In</span>';
                authBtn.disabled = false;
                authBtn.style.display = 'flex'; // Ensure visibility
            }
            
            if (userMenu) {
                userMenu.classList.add('hidden');
            }
            
            if (tabNav) {
                tabNav.classList.add('hidden');
            }
            
            // Hide add to favorites buttons
            const favoriteButtons = document.querySelectorAll('.favorite-btn');
            favoriteButtons.forEach(btn => btn.classList.add('hidden'));
        }
        
        // Reinitialize Lucide icons for any new icons added
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },
    
    // Update user menu information
    updateUserMenuInfo() {
        if (!this.currentUser) return;
        
        const userName = document.querySelector('.user-name');
        const userEmail = document.querySelector('.user-email');
        const avatarImg = document.querySelector('.avatar-img');
        const avatarFallback = document.querySelector('.avatar-fallback');
        
        if (userName) {
            userName.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }
        
        if (userEmail) {
            userEmail.textContent = this.currentUser.email;
        }
        
        if (avatarImg && this.currentUser.profileImageUrl) {
            avatarImg.src = this.currentUser.profileImageUrl;
            avatarImg.style.display = 'block';
            if (avatarFallback) avatarFallback.style.display = 'none';
        } else if (avatarFallback) {
            avatarFallback.textContent = this.getUserInitials();
            avatarFallback.style.display = 'flex';
            if (avatarImg) avatarImg.style.display = 'none';
        }
    },
    
    // Get user initials for avatar
    getUserInitials() {
        if (!this.currentUser) return 'U';
        
        const first = this.currentUser.firstName?.[0] || '';
        const last = this.currentUser.lastName?.[0] || '';
        
        return (first + last) || this.currentUser.email?.[0]?.toUpperCase() || 'U';
    },
    
    // Show success message
    showSuccessMessage(message) {
        const toast = document.getElementById('success-toast');
        const toastMessage = document.getElementById('toast-message');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.classList.remove('hidden');
            toast.classList.add('animate-slide-in-up');
            
            setTimeout(() => {
                toast.classList.add('hidden');
                toast.classList.remove('animate-slide-in-up');
            }, 3000);
        }
    },
    
    // Show error message
    showErrorMessage(message) {
        window.AppComponents.showError(message);
    },
    
    // Check authentication status and redirect if needed
    requireAuth(callback) {
        if (this.isAuthenticated) {
            callback();
        } else {
            this.showErrorMessage('Please sign in to use this feature');
            this.login();
        }
    },
    
    // Auto-login for demo purposes
    async autoLogin() {
        const config = window.WeatherAppConfig;
        if (config?.auth?.mockUser && !this.isAuthenticated) {
            console.log('Auto-login for demo');
            await this.login(config.auth.mockUser.email);
        }
    },
    
    // Handle authentication events
    setupEventListeners() {
        // Sign in button
        const authBtn = document.getElementById('auth-btn');
        if (authBtn) {
            authBtn.addEventListener('click', () => {
                this.login();
            });
        }
        
        // User avatar menu toggle
        const userAvatar = document.getElementById('user-avatar');
        const userMenu = document.getElementById('user-menu');
        if (userAvatar && userMenu) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('open');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenu.contains(e.target)) {
                    userMenu.classList.remove('open');
                }
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
        
        // Menu item navigation
        const menuItems = document.querySelectorAll('.menu-item[href]');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                if (href.startsWith('#')) {
                    const tabName = href.substring(1);
                    window.AppComponents.switchTab(tabName);
                }
                userMenu?.classList.remove('open');
            });
        });
    },
    
    // Demo authentication helper
    showAuthDemo() {
        const demoDialog = document.createElement('div');
        demoDialog.className = 'modal';
        demoDialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Demo Authentication</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>This is a demo authentication system for the static website.</p>
                    <p>Click "Sign In as Demo User" to access all features:</p>
                    <ul style="margin: 1rem 0; padding-left: 1.5rem;">
                        <li>Weather Dashboard</li>
                        <li>Favorite Locations</li>
                        <li>Weather Alerts</li>
                        <li>Settings & Preferences</li>
                    </ul>
                    <p><strong>Note:</strong> All data is stored locally in your browser.</p>
                </div>
                <div class="modal-footer">
                    <button class="action-btn secondary" onclick="this.closest('.modal').remove()">
                        Cancel
                    </button>
                    <button class="action-btn" onclick="window.AuthService.login(); this.closest('.modal').remove();">
                        <i data-lucide="user-check"></i>
                        <span>Sign In as Demo User</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(demoDialog);
        
        // Initialize icons in the modal
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
};

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.AuthService.init();
    window.AuthService.setupEventListeners();
    
    console.log('Authentication service initialized');
});

// Export for use in other modules
window.AuthService = AuthService;