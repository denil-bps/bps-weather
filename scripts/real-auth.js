// Real Replit Authentication Integration for Static Site
window.RealAuthService = {
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    apiBaseUrl: window.location.origin, // Use same backend as React app
    
    // Check if running on same domain (real integration) vs standalone
    isIntegratedMode: window.location.pathname.startsWith('/static-weather') || window.location.port === '5000',
    
    // Initialize authentication by checking backend session
    async init() {
        this.isLoading = true;
        this.updateUI();
        
        try {
            // Check if user is already authenticated with backend
            const response = await fetch(`${this.apiBaseUrl}/api/auth/user`, {
                method: 'GET',
                credentials: 'include', // Include session cookies
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                this.isAuthenticated = true;
                console.log('User authenticated with Replit:', user.email);
            } else {
                // User not authenticated
                this.currentUser = null;
                this.isAuthenticated = false;
                console.log('User not authenticated');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.currentUser = null;
            this.isAuthenticated = false;
        }
        
        this.isLoading = false;
        this.updateUI();
        return this.currentUser;
    },
    
    // Redirect to Replit login
    login() {
        console.log('Redirecting to Replit authentication...');
        window.location.href = `${this.apiBaseUrl}/api/login`;
    },
    
    // Logout via backend
    logout() {
        console.log('Logging out...');
        window.location.href = `${this.apiBaseUrl}/api/logout`;
    },
    
    // Update UI based on authentication state
    updateUI() {
        const authBtn = document.getElementById('auth-btn');
        const userMenu = document.getElementById('user-menu');
        const tabNavigation = document.getElementById('tab-navigation');
        
        if (this.isLoading) {
            // Show loading state
            if (authBtn) {
                authBtn.innerHTML = '<i data-lucide="loader"></i><span>Loading...</span>';
                authBtn.disabled = true;
            }
            return;
        }
        
        if (this.isAuthenticated && this.currentUser) {
            // Show authenticated UI
            if (authBtn) {
                authBtn.style.display = 'none';
            }
            
            if (userMenu) {
                userMenu.classList.remove('hidden');
                userMenu.style.display = 'block';
                
                // Update user info in dropdown
                const userNameSpan = userMenu.querySelector('.user-name');
                const userEmailSpan = userMenu.querySelector('.user-email');
                const avatarImg = userMenu.querySelector('.avatar-img');
                const avatarFallback = userMenu.querySelector('.avatar-fallback');
                
                if (userNameSpan) {
                    userNameSpan.textContent = `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim() || 'User';
                }
                if (userEmailSpan) {
                    userEmailSpan.textContent = this.currentUser.email || '';
                }
                
                if (avatarImg && this.currentUser.profileImageUrl) {
                    avatarImg.src = this.currentUser.profileImageUrl;
                    avatarImg.style.display = 'block';
                    if (avatarFallback) avatarFallback.style.display = 'none';
                } else if (avatarFallback) {
                    avatarFallback.textContent = (this.currentUser.firstName?.[0] || 'U').toUpperCase();
                    avatarFallback.style.display = 'flex';
                    if (avatarImg) avatarImg.style.display = 'none';
                }
            }
            
            // Show navigation tabs
            if (tabNavigation) {
                tabNavigation.classList.remove('hidden');
            }
            
            // Show add to favorites buttons
            const favoriteButtons = document.querySelectorAll('.favorite-btn');
            favoriteButtons.forEach(btn => btn.classList.remove('hidden'));
            
        } else {
            // Show unauthenticated UI
            if (authBtn) {
                authBtn.classList.remove('hidden');
                authBtn.style.display = 'flex';
                authBtn.innerHTML = '<i data-lucide="user"></i><span>Sign In</span>';
                authBtn.disabled = false;
            }
            
            if (userMenu) {
                userMenu.classList.add('hidden');
                userMenu.style.display = 'none';
            }
            
            // Hide navigation tabs
            if (tabNavigation) {
                tabNavigation.classList.add('hidden');
            }
            
            // Hide add to favorites buttons
            const favoriteButtons = document.querySelectorAll('.favorite-btn');
            favoriteButtons.forEach(btn => btn.classList.add('hidden'));
        }
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },
    
    // Get user favorites from backend
    async getFavorites() {
        if (!this.isAuthenticated) return [];
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/favorites`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
        }
        return [];
    },
    
    // Add location to favorites via backend
    async addToFavorites(location) {
        if (!this.isAuthenticated) {
            this.login();
            return false;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/favorites`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    locationName: location.name,
                    latitude: location.lat,
                    longitude: location.lon,
                    country: location.country,
                    state: location.state
                })
            });
            
            if (response.ok) {
                console.log('Added to favorites:', location.name);
                return true;
            } else {
                console.error('Failed to add to favorites:', response.statusText);
                return false;
            }
        } catch (error) {
            console.error('Error adding to favorites:', error);
            return false;
        }
    },
    
    // Remove from favorites via backend
    async removeFromFavorites(locationId) {
        if (!this.isAuthenticated) return false;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/favorites/${locationId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (response.ok) {
                console.log('Removed from favorites');
                return true;
            }
        } catch (error) {
            console.error('Error removing from favorites:', error);
        }
        return false;
    }
};

// Replace AuthService with RealAuthService
window.AuthService = window.RealAuthService;