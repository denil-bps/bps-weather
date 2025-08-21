// Main application initialization and coordination
(function() {
    'use strict';
    
    // App state
    const App = {
        initialized: false,
        isOnline: navigator.onLine,
        lastUpdateTime: null,
        
        // Initialize the application
        async init() {
            console.log('🌤️ BPS Weather App - Starting initialization...');
            
            try {
                // Check prerequisites
                this.checkPrerequisites();
                
                // Initialize core services in parallel
                await Promise.all([
                    this.initServices(),
                    this.setupGlobalHandlers(),
                    this.checkApiConfiguration()
                ]);
                
                // Auto-login for demo if enabled
                this.handleAutoLogin();
                
                // Setup periodic updates
                this.setupPeriodicUpdates();
                
                // Mark as initialized
                this.initialized = true;
                this.lastUpdateTime = new Date();
                
                console.log('✅ BPS Weather App - Initialization complete');
                
                // Show demo instructions if needed
                this.showWelcomeMessage();
                
            } catch (error) {
                console.error('❌ BPS Weather App - Initialization failed:', error);
                this.handleInitializationError(error);
            }
        },
        
        // Check prerequisites
        checkPrerequisites() {
            // Check for required browser features
            const requiredFeatures = {
                'localStorage': typeof Storage !== 'undefined',
                'fetch': typeof fetch !== 'undefined',
                'Promise': typeof Promise !== 'undefined',
                'JSON': typeof JSON !== 'undefined'
            };
            
            const missingFeatures = Object.entries(requiredFeatures)
                .filter(([name, available]) => !available)
                .map(([name]) => name);
            
            if (missingFeatures.length > 0) {
                throw new Error(`Browser not supported. Missing features: ${missingFeatures.join(', ')}`);
            }
            
            // Check for required DOM elements
            const requiredElements = [
                'loading-screen',
                'search-input',
                'search-btn',
                'temp-unit-toggle',
                'home-tab'
            ];
            
            const missingElements = requiredElements.filter(id => !document.getElementById(id));
            
            if (missingElements.length > 0) {
                console.warn('Missing DOM elements:', missingElements);
            }
        },
        
        // Initialize services
        async initServices() {
            // Services are already initialized by their individual files
            // This method ensures proper coordination
            
            const services = [
                'WeatherAppConfig',
                'WeatherAPI',
                'StorageManager',
                'AuthService',
                'AppComponents'
            ];
            
            const unavailableServices = services.filter(service => !window[service]);
            
            if (unavailableServices.length > 0) {
                throw new Error(`Required services not loaded: ${unavailableServices.join(', ')}`);
            }
            
            console.log('Services initialized:', services.join(', '));
        },
        
        // Setup global event handlers
        setupGlobalHandlers() {
            // Online/offline status
            window.addEventListener('online', () => {
                this.isOnline = true;
                console.log('App is now online');
                this.showConnectionStatus('online');
            });
            
            window.addEventListener('offline', () => {
                this.isOnline = false;
                console.log('App is now offline');
                this.showConnectionStatus('offline');
            });
            
            // Visibility change (tab focus/blur)
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.handleAppResume();
                } else {
                    this.handleAppPause();
                }
            });
            
            // Before unload (save data)
            window.addEventListener('beforeunload', () => {
                this.handleAppClose();
            });
            
            // Global error handling
            window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
                this.handleGlobalError(event.error);
            });
            
            // Unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                this.handleGlobalError(event.reason);
            });
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                this.handleKeyboardShortcuts(e);
            });
        },
        
        // Check API configuration
        checkApiConfiguration() {
            const config = window.WeatherAppConfig;
            
            if (!config.utils.validateApiKey(config.weather.apiKey)) {
                console.warn('⚠️ Weather API key not configured or invalid');
                this.showApiKeyWarning();
            } else {
                console.log('✅ Weather API key configured');
            }
        },
        
        // Handle auto-login for demo
        handleAutoLogin() {
            const urlParams = new URLSearchParams(window.location.search);
            
            // Check for auto-login parameter
            if (urlParams.get('demo') === 'true' || urlParams.get('login') === 'auto') {
                console.log('Auto-login triggered');
                setTimeout(() => {
                    window.AuthService.autoLogin();
                }, 2000);
            }
        },
        
        // Setup periodic updates
        setupPeriodicUpdates() {
            const config = window.WeatherAppConfig;
            
            if (config.ui.autoRefresh) {
                // Update weather data every 5 minutes
                setInterval(() => {
                    this.refreshCurrentWeather();
                }, 5 * 60 * 1000);
                
                // Update favorites weather every 15 minutes
                setInterval(() => {
                    this.refreshFavoritesWeather();
                }, 15 * 60 * 1000);
                
                console.log('Periodic updates enabled');
            }
        },
        
        // Show welcome message for first-time users
        showWelcomeMessage() {
            const hasSeenWelcome = localStorage.getItem('bps_weather_welcome_seen');
            
            if (!hasSeenWelcome && !window.AuthService.isAuthenticated) {
                setTimeout(() => {
                    this.showWelcomeDialog();
                    localStorage.setItem('bps_weather_welcome_seen', 'true');
                }, 3000);
            }
        },
        
        // Show welcome dialog
        showWelcomeDialog() {
            const welcomeDialog = document.createElement('div');
            welcomeDialog.className = 'modal';
            welcomeDialog.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Welcome to BPS Weather App!</h3>
                        <button class="close-btn" onclick="this.closest('.modal').remove()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>Welcome to the weather platform for <strong>Vidya Niketan Birla Public School</strong>, Pilani!</p>
                        
                        <h4 style="margin-top: 1.5rem; margin-bottom: 1rem;">Get Started:</h4>
                        <ol style="margin-left: 1.5rem; line-height: 1.8;">
                            <li>Search for any city to see current weather and 5-day forecast</li>
                            <li>Sign in to access personalized features like favorites and alerts</li>
                            <li>Add your favorite locations for quick access</li>
                            <li>Set up weather alerts for important conditions</li>
                        </ol>
                        
                        <div style="background: var(--surface-variant); padding: 1rem; border-radius: 0.5rem; margin-top: 1.5rem;">
                            <p style="margin: 0; font-size: 0.875rem; color: var(--text-muted);">
                                <strong>Note:</strong> This is a static demo version. Sign in to explore all features with local data storage.
                            </p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="action-btn secondary" onclick="this.closest('.modal').remove()">
                            <span>Start Exploring</span>
                        </button>
                        <button class="action-btn" onclick="window.AuthService.showAuthDemo(); this.closest('.modal').remove();">
                            <i data-lucide="user-plus"></i>
                            <span>Sign In for Full Features</span>
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(welcomeDialog);
            
            // Initialize Lucide icons
            if (window.lucide) {
                window.lucide.createIcons();
            }
        },
        
        // Show API key warning
        showApiKeyWarning() {
            console.warn('Weather API key not configured. Some features may be limited.');
            
            // Create a subtle notification
            const notification = document.createElement('div');
            notification.className = 'api-key-warning';
            notification.innerHTML = `
                <div style="
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: var(--warning);
                    color: white;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 1000;
                    max-width: 300px;
                    font-size: 0.875rem;
                ">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">
                        ⚠️ Demo Mode
                    </div>
                    <div>
                        Weather API key not configured. 
                        <a href="https://openweathermap.org/api" target="_blank" 
                           style="color: white; text-decoration: underline;">
                           Get your free API key
                        </a> for full functionality.
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="
                                position: absolute;
                                top: 0.5rem;
                                right: 0.5rem;
                                background: none;
                                border: none;
                                color: white;
                                cursor: pointer;
                                font-size: 1rem;
                            ">
                        ×
                    </button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                notification.remove();
            }, 10000);
        },
        
        // Connection status handling
        showConnectionStatus(status) {
            const statusElement = document.getElementById('connection-status') || this.createConnectionStatusElement();
            
            statusElement.className = `connection-status ${status}`;
            statusElement.textContent = status === 'online' ? '🟢 Online' : '🔴 Offline';
            
            if (status === 'offline') {
                statusElement.title = 'You are offline. Some features may not work.';
            } else {
                statusElement.title = 'Connected to the internet';
            }
            
            // Auto-hide online status after 3 seconds
            if (status === 'online') {
                setTimeout(() => {
                    statusElement.style.opacity = '0';
                }, 3000);
            }
        },
        
        // Create connection status element
        createConnectionStatusElement() {
            const statusElement = document.createElement('div');
            statusElement.id = 'connection-status';
            statusElement.style.cssText = `
                position: fixed;
                top: 100px;
                left: 20px;
                padding: 0.5rem 1rem;
                border-radius: 2rem;
                font-size: 0.8rem;
                font-weight: 600;
                z-index: 1000;
                transition: opacity 0.3s ease;
                background: var(--surface);
                box-shadow: 0 2px 10px var(--shadow);
            `;
            
            document.body.appendChild(statusElement);
            return statusElement;
        },
        
        // Handle app resume (when tab becomes visible)
        handleAppResume() {
            console.log('App resumed');
            
            // Update activity timestamp
            window.StorageManager.profile.updateLastActivity();
            
            // Refresh data if it's been a while
            const now = Date.now();
            if (this.lastUpdateTime && (now - this.lastUpdateTime.getTime()) > 5 * 60 * 1000) {
                this.refreshCurrentWeather();
            }
        },
        
        // Handle app pause (when tab loses focus)
        handleAppPause() {
            console.log('App paused');
            // Could save state or pause timers here
        },
        
        // Handle app close
        handleAppClose() {
            console.log('App closing');
            // Save any pending data
            window.StorageManager.profile.updateLastActivity();
        },
        
        // Global error handling
        handleGlobalError(error) {
            console.error('Global error handler:', error);
            
            // Don't show error UI for minor issues
            if (error?.message?.includes('Loading CSS chunk')) {
                return;
            }
            
            // Show user-friendly error message for critical issues
            if (error?.message?.includes('network') || error?.name === 'TypeError') {
                window.AppComponents?.showError(
                    'Something went wrong. Please refresh the page and try again.'
                );
            }
        },
        
        // Initialization error handling
        handleInitializationError(error) {
            console.error('Initialization error:', error);
            
            // Show fallback error message
            document.body.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    flex-direction: column;
                    gap: 2rem;
                    padding: 2rem;
                    text-align: center;
                    font-family: 'Inter', sans-serif;
                ">
                    <div style="color: #dc2626; font-size: 3rem;">⚠️</div>
                    <h1 style="color: #1f2937; margin: 0;">Failed to Load BPS Weather App</h1>
                    <p style="color: #6b7280; max-width: 500px;">
                        There was an error initializing the application. 
                        Please refresh the page and try again.
                    </p>
                    <button onclick="window.location.reload()" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 0.5rem;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        Refresh Page
                    </button>
                    <details style="margin-top: 2rem; text-align: left; max-width: 600px;">
                        <summary style="cursor: pointer; color: #6b7280;">Technical Details</summary>
                        <pre style="
                            background: #f3f4f6;
                            padding: 1rem;
                            border-radius: 0.5rem;
                            overflow: auto;
                            margin-top: 1rem;
                            font-size: 0.875rem;
                        ">${error.message}\n\nStack:\n${error.stack}</pre>
                    </details>
                </div>
            `;
        },
        
        // Keyboard shortcuts
        handleKeyboardShortcuts(event) {
            // Ctrl/Cmd + K: Focus search
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
            
            // Escape: Close modals/dropdowns
            if (event.key === 'Escape') {
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    modal.classList.add('hidden');
                });
                
                document.querySelectorAll('.user-menu.open').forEach(menu => {
                    menu.classList.remove('open');
                });
                
                window.AppComponents?.hideSuggestions();
            }
        },
        
        // Refresh current weather data
        async refreshCurrentWeather() {
            if (!this.isOnline || !window.AppComponents.currentLocation) {
                return;
            }
            
            try {
                console.log('Refreshing current weather data');
                await window.AppComponents.performSearch(window.AppComponents.currentLocation.name);
                this.lastUpdateTime = new Date();
            } catch (error) {
                console.warn('Failed to refresh weather data:', error);
            }
        },
        
        // Refresh favorites weather data
        async refreshFavoritesWeather() {
            if (!this.isOnline || !window.AuthService.isAuthenticated) {
                return;
            }
            
            const favorites = window.StorageManager.favorites.getAll();
            
            for (const favorite of favorites.slice(0, 3)) { // Limit to first 3 to avoid API rate limits
                try {
                    const weatherData = await window.WeatherAPI.getCurrentWeather(favorite.name);
                    window.StorageManager.favorites.updateWeatherData(favorite.id, weatherData);
                } catch (error) {
                    console.warn(`Failed to update weather for ${favorite.name}:`, error);
                }
            }
            
            console.log('Favorites weather data refreshed');
        },
        
        // Get app status
        getStatus() {
            return {
                initialized: this.initialized,
                isOnline: this.isOnline,
                lastUpdate: this.lastUpdateTime,
                isAuthenticated: window.AuthService?.isAuthenticated || false,
                currentLocation: window.AppComponents?.currentLocation,
                favoritesCount: window.StorageManager?.favorites.getAll().length || 0,
                alertsCount: window.StorageManager?.alerts.getAll().length || 0
            };
        }
    };
    
    // Initialize app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }
    
    // Global app reference for debugging
    window.BPSWeatherApp = App;
    
})();