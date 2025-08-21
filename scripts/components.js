// UI Components and utilities for BPS Weather App
window.AppComponents = {
    // Current app state
    currentTab: 'home',
    currentLocation: null,
    currentWeatherData: null,
    tempUnit: 'celsius',
    
    // Initialize the application
    async init() {
        this.loadSettings();
        this.setupEventListeners();
        this.showLoadingScreen();
        
        // Initialize other services
        await window.AuthService.init();
        
        // Load popular cities
        this.loadPopularCities();
        
        // Hide loading screen
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 1500);
        
        console.log('App components initialized');
    },
    
    // Load user settings
    loadSettings() {
        const settings = window.StorageManager.settings.getAll();
        this.tempUnit = settings.tempUnit || 'celsius';
        
        // Apply settings to UI
        const tempToggle = document.getElementById('temp-unit-toggle');
        if (tempToggle) {
            tempToggle.checked = this.tempUnit === 'fahrenheit';
        }
        
        // Apply theme
        document.body.setAttribute('data-theme', settings.theme || 'light');
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Search functionality
        this.setupSearch();
        
        // Temperature unit toggle
        this.setupTempToggle();
        
        // Tab navigation
        this.setupTabNavigation();
        
        // Popular cities
        this.setupPopularCities();
        
        // Settings
        this.setupSettings();
        
        // Alerts
        this.setupAlerts();
        
        // General close handlers
        this.setupCloseHandlers();
    },
    
    // Setup search functionality
    setupSearch() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        const suggestions = document.getElementById('search-suggestions');
        
        if (!searchInput || !searchBtn) return;
        
        let searchTimeout;
        
        // Search input handler
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                this.hideSuggestions();
                return;
            }
            
            searchTimeout = setTimeout(async () => {
                await this.showSearchSuggestions(query);
            }, 300);
        });
        
        // Search button handler
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                this.performSearch(query);
            }
        });
        
        // Enter key handler
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    this.performSearch(query);
                }
            }
        });
        
        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestions?.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    },
    
    // Show search suggestions
    async showSearchSuggestions(query) {
        const suggestions = document.getElementById('search-suggestions');
        if (!suggestions) return;
        
        try {
            const cities = await window.WeatherAPI.searchCities(query);
            
            if (cities.length === 0) {
                this.hideSuggestions();
                return;
            }
            
            suggestions.innerHTML = '';
            
            cities.forEach(city => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `
                    <div>
                        <strong>${city.name}</strong>
                        <span class="text-muted">${city.state ? `${city.state}, ` : ''}${city.country}</span>
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    this.performSearch(city.name);
                    this.hideSuggestions();
                });
                
                suggestions.appendChild(item);
            });
            
            suggestions.classList.remove('hidden');
            
        } catch (error) {
            console.warn('Search suggestions failed:', error);
            this.hideSuggestions();
        }
    },
    
    // Hide search suggestions
    hideSuggestions() {
        const suggestions = document.getElementById('search-suggestions');
        if (suggestions) {
            suggestions.classList.add('hidden');
        }
    },
    
    // Perform weather search
    async performSearch(location) {
        try {
            this.showLoading();
            this.hideSuggestions();
            
            // Clear search input
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = '';
            
            // Get weather data
            const weatherData = await window.WeatherAPI.getCompleteWeather(location);
            
            // Save to recent searches
            window.StorageManager.recentSearches.add({
                location: weatherData.location.name,
                query: location,
                coordinates: {
                    lat: weatherData.location.lat,
                    lon: weatherData.location.lon
                }
            });
            
            // Display weather data
            this.displayWeatherData(weatherData);
            
            // Hide welcome screen and show weather content
            this.hideWelcomeScreen();
            this.showWeatherContent();
            
            // Update dashboard if user is authenticated
            if (window.AuthService.isAuthenticated) {
                this.updateDashboard();
            }
            
            this.hideLoading();
            
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    },
    
    // Display weather data
    displayWeatherData(weatherData) {
        this.currentWeatherData = weatherData;
        this.currentLocation = weatherData.location;
        
        // Update current weather
        this.updateCurrentWeather(weatherData);
        
        // Update hourly forecast
        this.updateHourlyForecast(weatherData.hourly);
        
        // Update daily forecast
        this.updateDailyForecast(weatherData.daily);
        
        // Update sun times
        this.updateSunTimes(weatherData.current);
        
        // Show/hide add to favorites button
        this.updateFavoriteButton(weatherData.location);
    },
    
    // Update current weather display
    updateCurrentWeather(weatherData) {
        const config = window.WeatherAppConfig;
        
        // Location and date
        document.getElementById('current-location').textContent = 
            `${weatherData.location.name}, ${weatherData.location.country}`;
        document.getElementById('current-date').textContent = 
            config.utils.formatDate(weatherData.current.date);
        
        // Temperature
        const temp = this.convertTemperature(weatherData.current.temp);
        document.getElementById('current-temp').textContent = Math.round(temp);
        
        // Update temp unit displays
        const tempUnits = document.querySelectorAll('.temp-unit');
        tempUnits.forEach(unit => {
            unit.textContent = this.tempUnit === 'celsius' ? '°C' : '°F';
        });
        
        // Weather icon
        const iconElement = document.getElementById('weather-icon');
        if (iconElement) {
            const iconName = config.utils.getWeatherIcon(weatherData.current.icon);
            iconElement.innerHTML = `<i data-lucide="${iconName}"></i>`;
        }
        
        // Weather details
        document.getElementById('feels-like').textContent = 
            `${Math.round(this.convertTemperature(weatherData.current.feels_like))}°${this.tempUnit === 'celsius' ? 'C' : 'F'}`;
        document.getElementById('humidity').textContent = `${weatherData.current.humidity}%`;
        document.getElementById('wind-speed').textContent = `${weatherData.current.wind_speed} km/h`;
        document.getElementById('pressure').textContent = `${weatherData.current.pressure} hPa`;
        
        // Add weather condition class for animations
        const weatherCard = document.querySelector('.weather-card');
        if (weatherCard) {
            // Remove existing weather classes
            weatherCard.classList.remove('weather-sunny', 'weather-rainy', 'weather-snowy', 'weather-cloudy');
            
            // Add appropriate class based on condition
            const condition = weatherData.current.condition.toLowerCase();
            if (condition.includes('clear') || condition.includes('sun')) {
                weatherCard.classList.add('weather-sunny');
            } else if (condition.includes('rain') || condition.includes('drizzle')) {
                weatherCard.classList.add('weather-rainy');
            } else if (condition.includes('snow')) {
                weatherCard.classList.add('weather-snowy');
            } else if (condition.includes('cloud')) {
                weatherCard.classList.add('weather-cloudy');
            }
        }
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },
    
    // Update hourly forecast
    updateHourlyForecast(hourlyData) {
        const container = document.getElementById('hourly-scroll');
        if (!container) return;
        
        container.innerHTML = '';
        
        hourlyData.forEach((hour, index) => {
            const temp = this.convertTemperature(hour.temp);
            const iconName = window.WeatherAppConfig.utils.getWeatherIcon(hour.icon);
            
            const hourItem = document.createElement('div');
            hourItem.className = 'hourly-item animate-fade-in-up';
            hourItem.style.animationDelay = `${index * 0.1}s`;
            
            hourItem.innerHTML = `
                <div class="hourly-time">${hour.time}</div>
                <div class="hourly-icon">
                    <i data-lucide="${iconName}"></i>
                </div>
                <div class="hourly-temp">${Math.round(temp)}°</div>
                <div class="hourly-condition">${hour.condition}</div>
            `;
            
            container.appendChild(hourItem);
        });
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },
    
    // Update daily forecast
    updateDailyForecast(dailyData) {
        const container = document.getElementById('daily-cards');
        if (!container) return;
        
        container.innerHTML = '';
        
        dailyData.forEach((day, index) => {
            const tempMax = this.convertTemperature(day.temp_max);
            const tempMin = this.convertTemperature(day.temp_min);
            const iconName = window.WeatherAppConfig.utils.getWeatherIcon(day.icon);
            
            const dayItem = document.createElement('div');
            dayItem.className = 'daily-item animate-fade-in-left';
            dayItem.style.animationDelay = `${index * 0.15}s`;
            
            dayItem.innerHTML = `
                <div>
                    <div class="daily-day">${day.day}</div>
                    <div class="daily-date">${new Date(day.date).toLocaleDateString()}</div>
                </div>
                <div class="daily-icon">
                    <i data-lucide="${iconName}"></i>
                </div>
                <div class="daily-condition">${day.condition}</div>
                <div class="daily-temps">
                    <span class="daily-high">${Math.round(tempMax)}°</span>
                    <span class="daily-low">${Math.round(tempMin)}°</span>
                </div>
                <div class="daily-details">
                    <span><i data-lucide="droplets"></i> ${day.humidity}%</span>
                    <span><i data-lucide="wind"></i> ${day.wind_speed} km/h</span>
                </div>
            `;
            
            container.appendChild(dayItem);
        });
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },
    
    // Update sun times
    updateSunTimes(currentData) {
        document.getElementById('sunrise-time').textContent = currentData.sunrise;
        document.getElementById('sunset-time').textContent = currentData.sunset;
        document.getElementById('day-length').textContent = currentData.day_length || '--';
    },
    
    // Update add to favorites button
    updateFavoriteButton(location) {
        const favBtn = document.getElementById('add-favorite-btn');
        if (!favBtn) return;
        
        const isAuthenticated = window.AuthService.isAuthenticated;
        const isFavorite = window.StorageManager.favorites.exists(location);
        
        if (isAuthenticated) {
            favBtn.classList.remove('hidden');
            
            if (isFavorite) {
                favBtn.innerHTML = '<i data-lucide="heart-off"></i><span>Remove from Favorites</span>';
                favBtn.onclick = () => this.removeFromFavorites(location);
            } else {
                favBtn.innerHTML = '<i data-lucide="heart"></i><span>Add to Favorites</span>';
                favBtn.onclick = () => this.addToFavorites(location);
            }
        } else {
            favBtn.classList.add('hidden');
        }
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },
    
    // Temperature conversion
    convertTemperature(temp) {
        const config = window.WeatherAppConfig;
        return config.utils.convertTemperature(temp, 'celsius', this.tempUnit);
    },
    
    // Setup temperature toggle
    setupTempToggle() {
        const toggle = document.getElementById('temp-unit-toggle');
        if (!toggle) return;
        
        toggle.addEventListener('change', (e) => {
            this.tempUnit = e.target.checked ? 'fahrenheit' : 'celsius';
            
            // Save setting
            window.StorageManager.settings.set('tempUnit', this.tempUnit);
            
            // Update display if weather data exists
            if (this.currentWeatherData) {
                this.displayWeatherData(this.currentWeatherData);
            }
        });
    },
    
    // Setup tab navigation
    setupTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
        
        // Setup quick action buttons
        const actionBtns = document.querySelectorAll('.action-btn[data-tab]');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
    },
    
    // Switch tabs
    switchTab(tabName) {
        // Update tab buttons
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });
        
        // Update tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        this.currentTab = tabName;
        
        // Load tab-specific content
        switch (tabName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'favorites':
                this.loadFavorites();
                break;
            case 'alerts':
                this.loadAlerts();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    },
    
    // Setup popular cities
    setupPopularCities() {
        const cityCards = document.querySelectorAll('.city-card');
        
        cityCards.forEach(card => {
            card.addEventListener('click', () => {
                const city = card.getAttribute('data-city');
                if (city) {
                    this.performSearch(city);
                }
            });
        });
    },
    
    // Load popular cities into welcome screen
    loadPopularCities() {
        const cityGrid = document.querySelector('.city-grid');
        if (!cityGrid) return;
        
        const cities = window.WeatherAppConfig.popularCities.slice(0, 6);
        
        cityGrid.innerHTML = cities.map(city => `
            <button class="city-card hover-lift" data-city="${city.name}">
                <span class="city-name">${city.name}</span>
                <i data-lucide="sun"></i>
            </button>
        `).join('');
        
        // Setup click handlers
        this.setupPopularCities();
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },
    
    // Show/hide screens
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    },
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    },
    
    showWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcome-screen');
        const weatherContent = document.getElementById('weather-content');
        
        if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        if (weatherContent) weatherContent.classList.add('hidden');
    },
    
    hideWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('hidden');
        }
    },
    
    showWeatherContent() {
        const weatherContent = document.getElementById('weather-content');
        if (weatherContent) {
            weatherContent.classList.remove('hidden');
            weatherContent.classList.add('animate-fade-in');
        }
    },
    
    // Loading states
    showLoading() {
        const existingLoader = document.querySelector('.inline-loader');
        if (existingLoader) return;
        
        const loader = document.createElement('div');
        loader.className = 'inline-loader';
        loader.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; padding: 2rem;">
                <div class="loading-spinner"></div>
                <span style="margin-left: 1rem;">Loading weather data...</span>
            </div>
        `;
        
        const mainContent = document.querySelector('.main-content .container');
        if (mainContent) {
            mainContent.appendChild(loader);
        }
    },
    
    hideLoading() {
        const loader = document.querySelector('.inline-loader');
        if (loader) {
            loader.remove();
        }
    },
    
    // Error handling
    showError(message, details = '') {
        const modal = document.getElementById('error-modal');
        const errorMessage = document.getElementById('error-message');
        const retryBtn = document.getElementById('error-retry');
        
        if (modal && errorMessage) {
            errorMessage.textContent = message;
            modal.classList.remove('hidden');
            
            // Setup retry button
            if (retryBtn) {
                retryBtn.onclick = () => {
                    modal.classList.add('hidden');
                    if (this.currentLocation) {
                        this.performSearch(this.currentLocation.name);
                    }
                };
            }
        } else {
            // Fallback alert
            alert(message);
        }
    },
    
    // Setup close handlers
    setupCloseHandlers() {
        const closeErrorBtn = document.getElementById('close-error');
        if (closeErrorBtn) {
            closeErrorBtn.addEventListener('click', () => {
                document.getElementById('error-modal')?.classList.add('hidden');
            });
        }
        
        // Close modal when clicking outside
        const modal = document.getElementById('error-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    },
    
    // Add to favorites
    async addToFavorites(location) {
        try {
            window.StorageManager.favorites.add(location);
            this.showSuccessMessage('Location added to favorites!');
            this.updateFavoriteButton(location);
            this.updateDashboard();
        } catch (error) {
            this.showError(error.message);
        }
    },
    
    // Remove from favorites
    async removeFromFavorites(location) {
        try {
            const favorites = window.StorageManager.favorites.getAll();
            const favorite = favorites.find(fav => 
                fav.name.toLowerCase() === location.name.toLowerCase()
            );
            
            if (favorite) {
                window.StorageManager.favorites.remove(favorite.id);
                this.showSuccessMessage('Location removed from favorites!');
                this.updateFavoriteButton(location);
                this.updateDashboard();
                this.loadFavorites(); // Refresh favorites tab
            }
        } catch (error) {
            this.showError(error.message);
        }
    },
    
    // Load dashboard content
    loadDashboard() {
        const favoriteCount = document.getElementById('favorite-count');
        const alertCount = document.getElementById('alert-count');
        const searchCount = document.getElementById('search-count');
        const recentSearches = document.getElementById('recent-searches');
        const weatherSummary = document.getElementById('weather-summary');
        
        // Update counts
        if (favoriteCount) {
            favoriteCount.textContent = window.StorageManager.favorites.getAll().length;
        }
        
        if (alertCount) {
            alertCount.textContent = window.StorageManager.alerts.getAll().filter(a => a.isActive).length;
        }
        
        if (searchCount) {
            searchCount.textContent = window.StorageManager.recentSearches.getAll().length;
        }
        
        // Load recent searches
        if (recentSearches) {
            const searches = window.StorageManager.recentSearches.getAll().slice(0, 5);
            
            if (searches.length === 0) {
                recentSearches.innerHTML = '<p class="empty-state">No recent searches</p>';
            } else {
                recentSearches.innerHTML = searches.map(search => `
                    <div class="recent-item">
                        <div>
                            <div class="recent-location">${search.location}</div>
                            <div class="recent-time">${new Date(search.timestamp).toLocaleDateString()}</div>
                        </div>
                        <button class="action-btn" onclick="window.AppComponents.performSearch('${search.location}')">
                            <i data-lucide="search"></i>
                        </button>
                    </div>
                `).join('');
            }
        }
        
        // Update weather summary
        if (weatherSummary) {
            if (this.currentWeatherData) {
                const temp = this.convertTemperature(this.currentWeatherData.current.temp);
                weatherSummary.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div>
                            <div style="font-weight: 600;">${this.currentWeatherData.location.name}</div>
                            <div style="color: var(--text-muted);">${this.currentWeatherData.current.condition}</div>
                        </div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">
                            ${Math.round(temp)}°${this.tempUnit === 'celsius' ? 'C' : 'F'}
                        </div>
                    </div>
                `;
            } else {
                weatherSummary.innerHTML = '<p class="empty-state">Search for a location to see weather summary</p>';
            }
        }
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },
    
    // Load favorites content
    loadFavorites() {
        const favoritesGrid = document.getElementById('favorites-grid');
        if (!favoritesGrid) return;
        
        const favorites = window.StorageManager.favorites.getAll();
        
        if (favorites.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="empty-favorites">
                    <i data-lucide="heart"></i>
                    <h3>No Favorites Yet</h3>
                    <p>Search for locations and add them to your favorites for quick access</p>
                    <button class="action-btn" onclick="window.AppComponents.switchTab('home')">
                        <i data-lucide="search"></i>
                        <span>Search Locations</span>
                    </button>
                </div>
            `;
        } else {
            favoritesGrid.innerHTML = favorites.map(fav => `
                <div class="favorite-card">
                    <div class="favorite-header">
                        <div class="favorite-location">${fav.name}</div>
                        <button class="remove-favorite" onclick="window.AppComponents.removeFavoriteById('${fav.id}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                    <div style="color: var(--text-muted); margin-bottom: 1rem;">
                        ${fav.state ? `${fav.state}, ` : ''}${fav.country}
                    </div>
                    ${fav.currentWeather ? `
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <div style="font-size: 1.25rem; font-weight: 600;">
                                    ${Math.round(this.convertTemperature(fav.currentWeather.temp))}°${this.tempUnit === 'celsius' ? 'C' : 'F'}
                                </div>
                                <div style="color: var(--text-muted);">${fav.currentWeather.condition}</div>
                            </div>
                            <i data-lucide="${window.WeatherAppConfig.utils.getWeatherIcon(fav.currentWeather.icon)}"></i>
                        </div>
                    ` : ''}
                    <button class="action-btn" onclick="window.AppComponents.performSearch('${fav.name}'); window.AppComponents.switchTab('home');" style="width: 100%; margin-top: 1rem;">
                        <i data-lucide="cloud-sun"></i>
                        <span>View Weather</span>
                    </button>
                </div>
            `).join('');
        }
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },
    
    // Remove favorite by ID
    removeFavoriteById(favoriteId) {
        window.StorageManager.favorites.remove(favoriteId);
        this.loadFavorites();
        this.updateDashboard();
        this.showSuccessMessage('Location removed from favorites!');
    },
    
    // Setup alerts functionality
    setupAlerts() {
        const alertForm = document.getElementById('alert-form');
        if (!alertForm) return;
        
        alertForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAlert();
        });
        
        // Populate location dropdown
        this.updateAlertLocationDropdown();
    },
    
    // Update alert location dropdown
    updateAlertLocationDropdown() {
        const dropdown = document.getElementById('alert-location');
        if (!dropdown) return;
        
        const favorites = window.StorageManager.favorites.getAll();
        
        dropdown.innerHTML = '<option value="">Select a favorite location</option>';
        
        favorites.forEach(fav => {
            const option = document.createElement('option');
            option.value = fav.id;
            option.textContent = fav.name;
            dropdown.appendChild(option);
        });
    },
    
    // Create weather alert
    createAlert() {
        const locationId = document.getElementById('alert-location').value;
        const alertType = document.getElementById('alert-type').value;
        const condition = document.getElementById('alert-condition').value;
        const threshold = document.getElementById('alert-threshold').value;
        
        if (!locationId || !alertType || !condition || !threshold) {
            this.showError('Please fill in all fields');
            return;
        }
        
        const favorites = window.StorageManager.favorites.getAll();
        const location = favorites.find(fav => fav.id === locationId);
        
        if (!location) {
            this.showError('Selected location not found');
            return;
        }
        
        try {
            window.StorageManager.alerts.add({
                locationId,
                locationName: location.name,
                alertType,
                condition,
                threshold: parseFloat(threshold)
            });
            
            // Reset form
            document.getElementById('alert-form').reset();
            
            this.showSuccessMessage('Weather alert created successfully!');
            this.loadAlerts();
            this.updateDashboard();
            
        } catch (error) {
            this.showError('Failed to create alert: ' + error.message);
        }
    },
    
    // Load alerts content
    loadAlerts() {
        const alertsList = document.getElementById('alerts-list');
        if (!alertsList) return;
        
        // Update location dropdown
        this.updateAlertLocationDropdown();
        
        const alerts = window.StorageManager.alerts.getAll();
        
        if (alerts.length === 0) {
            alertsList.innerHTML = `
                <div class="empty-alerts">
                    <i data-lucide="bell"></i>
                    <h3>No Active Alerts</h3>
                    <p>Create your first weather alert using the form above</p>
                </div>
            `;
        } else {
            alertsList.innerHTML = alerts.map(alert => `
                <div class="alert-item">
                    <div class="alert-header">
                        <div class="alert-title">
                            ${alert.locationName} - ${alert.alertType} ${alert.condition} ${alert.threshold}
                        </div>
                        <div class="alert-toggle">
                            <label class="switch">
                                <input type="checkbox" ${alert.isActive ? 'checked' : ''} 
                                       onchange="window.AppComponents.toggleAlert('${alert.id}')">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="alert-details">
                        Alert when ${alert.alertType} is ${alert.condition} ${alert.threshold}
                        ${alert.lastTriggered ? `<br>Last triggered: ${new Date(alert.lastTriggered).toLocaleString()}` : ''}
                    </div>
                    <button class="action-btn secondary" onclick="window.AppComponents.removeAlert('${alert.id}')" 
                            style="margin-top: 0.5rem;">
                        <i data-lucide="trash-2"></i>
                        <span>Remove Alert</span>
                    </button>
                </div>
            `).join('');
        }
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },
    
    // Toggle alert
    toggleAlert(alertId) {
        window.StorageManager.alerts.toggle(alertId);
        this.updateDashboard();
    },
    
    // Remove alert
    removeAlert(alertId) {
        window.StorageManager.alerts.remove(alertId);
        this.loadAlerts();
        this.updateDashboard();
        this.showSuccessMessage('Weather alert removed!');
    },
    
    // Setup settings
    setupSettings() {
        const saveBtn = document.getElementById('save-settings');
        if (!saveBtn) return;
        
        saveBtn.addEventListener('click', () => {
            this.saveSettings();
        });
        
        // Load current settings
        this.loadCurrentSettings();
    },
    
    // Load current settings into UI
    loadCurrentSettings() {
        const settings = window.StorageManager.settings.getAll();
        
        // Temperature unit
        const tempRadios = document.querySelectorAll('input[name="temp-setting"]');
        tempRadios.forEach(radio => {
            radio.checked = radio.value === settings.tempUnit;
        });
        
        // Theme
        const themeRadios = document.querySelectorAll('input[name="theme-setting"]');
        themeRadios.forEach(radio => {
            radio.checked = radio.value === settings.theme;
        });
        
        // Notifications
        const notificationsToggle = document.getElementById('notifications-toggle');
        if (notificationsToggle) {
            notificationsToggle.checked = settings.notifications;
        }
        
        const dailySummaryToggle = document.getElementById('daily-summary-toggle');
        if (dailySummaryToggle) {
            dailySummaryToggle.checked = settings.dailySummary;
        }
    },
    
    // Save settings
    saveSettings() {
        const tempUnit = document.querySelector('input[name="temp-setting"]:checked')?.value || 'celsius';
        const theme = document.querySelector('input[name="theme-setting"]:checked')?.value || 'light';
        const notifications = document.getElementById('notifications-toggle')?.checked || false;
        const dailySummary = document.getElementById('daily-summary-toggle')?.checked || false;
        
        const newSettings = {
            tempUnit,
            theme,
            notifications,
            dailySummary
        };
        
        window.StorageManager.settings.update(newSettings);
        
        // Apply settings
        this.tempUnit = tempUnit;
        document.body.setAttribute('data-theme', theme);
        
        // Update temp toggle in header
        const tempToggle = document.getElementById('temp-unit-toggle');
        if (tempToggle) {
            tempToggle.checked = tempUnit === 'fahrenheit';
        }
        
        // Refresh weather display if needed
        if (this.currentWeatherData) {
            this.displayWeatherData(this.currentWeatherData);
        }
        
        this.showSuccessMessage('Settings saved successfully!');
    },
    
    // Update dashboard (refresh counts and data)
    updateDashboard() {
        if (this.currentTab === 'dashboard') {
            this.loadDashboard();
        }
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
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.AppComponents.init();
});

// Export for use in other modules
window.AppComponents = AppComponents;