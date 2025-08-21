// Local storage management for BPS Weather App
window.StorageManager = {
    // Get configuration
    config: window.WeatherAppConfig?.storage || {
        favorites: 'bps_weather_favorites',
        recentSearches: 'bps_weather_recent',
        userSettings: 'bps_weather_settings',
        weatherCache: 'bps_weather_cache',
        authToken: 'bps_weather_auth',
        userProfile: 'bps_weather_profile'
    },
    
    // Generic localStorage operations
    set(key, data) {
        try {
            const serializedData = JSON.stringify({
                data: data,
                timestamp: Date.now(),
                version: '1.0'
            });
            localStorage.setItem(key, serializedData);
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;
            
            const parsed = JSON.parse(item);
            return parsed.data || defaultValue;
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    },
    
    clear() {
        try {
            // Only clear app-specific keys
            const appKeys = Object.values(this.config);
            appKeys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
            return false;
        }
    },
    
    // Favorites management
    favorites: {
        getAll() {
            const manager = window.StorageManager;
            return manager.get(manager.config.favorites, []);
        },
        
        add(location) {
            const manager = window.StorageManager;
            const favorites = this.getAll();
            const config = window.WeatherAppConfig;
            
            // Check if already exists
            const exists = favorites.some(fav => 
                fav.name.toLowerCase() === location.name.toLowerCase() &&
                fav.country === location.country
            );
            
            if (exists) {
                throw new Error('Location already in favorites');
            }
            
            // Check maximum limit
            if (favorites.length >= (config?.app?.maxFavorites || 10)) {
                throw new Error(config?.messages?.errors?.maxFavoritesReached || 'Maximum favorites reached');
            }
            
            const newFavorite = {
                id: Date.now().toString(),
                name: location.name,
                country: location.country,
                state: location.state || '',
                lat: location.lat,
                lon: location.lon,
                addedAt: new Date().toISOString(),
                isDefault: favorites.length === 0 // First favorite is default
            };
            
            favorites.push(newFavorite);
            return manager.set(manager.config.favorites, favorites);
        },
        
        remove(locationId) {
            const manager = window.StorageManager;
            const favorites = this.getAll();
            const filtered = favorites.filter(fav => fav.id !== locationId);
            
            // If removed item was default, make first item default
            if (filtered.length > 0 && !filtered.some(fav => fav.isDefault)) {
                filtered[0].isDefault = true;
            }
            
            return manager.set(manager.config.favorites, filtered);
        },
        
        setDefault(locationId) {
            const manager = window.StorageManager;
            const favorites = this.getAll();
            
            favorites.forEach(fav => {
                fav.isDefault = fav.id === locationId;
            });
            
            return manager.set(manager.config.favorites, favorites);
        },
        
        getDefault() {
            const favorites = this.getAll();
            return favorites.find(fav => fav.isDefault) || favorites[0] || null;
        },
        
        exists(location) {
            const favorites = this.getAll();
            return favorites.some(fav => 
                fav.name.toLowerCase() === location.name.toLowerCase() &&
                fav.country === location.country
            );
        },
        
        updateWeatherData(locationId, weatherData) {
            const manager = window.StorageManager;
            const favorites = this.getAll();
            
            const favorite = favorites.find(fav => fav.id === locationId);
            if (favorite) {
                favorite.lastWeatherUpdate = new Date().toISOString();
                favorite.currentWeather = {
                    temp: weatherData.current?.temp,
                    condition: weatherData.current?.condition,
                    icon: weatherData.current?.icon
                };
                
                return manager.set(manager.config.favorites, favorites);
            }
            
            return false;
        }
    },
    
    // Recent searches management
    recentSearches: {
        getAll() {
            const manager = window.StorageManager;
            return manager.get(manager.config.recentSearches, []);
        },
        
        add(searchData) {
            const manager = window.StorageManager;
            const searches = this.getAll();
            const config = window.WeatherAppConfig;
            
            const newSearch = {
                id: Date.now().toString(),
                location: searchData.location,
                query: searchData.query || searchData.location,
                timestamp: new Date().toISOString(),
                coordinates: searchData.coordinates || null
            };
            
            // Remove if already exists
            const filtered = searches.filter(search => 
                search.location.toLowerCase() !== newSearch.location.toLowerCase()
            );
            
            // Add to beginning
            filtered.unshift(newSearch);
            
            // Keep only recent searches (limit)
            const limited = filtered.slice(0, config?.app?.maxRecentSearches || 10);
            
            return manager.set(manager.config.recentSearches, limited);
        },
        
        clear() {
            const manager = window.StorageManager;
            return manager.set(manager.config.recentSearches, []);
        },
        
        remove(searchId) {
            const manager = window.StorageManager;
            const searches = this.getAll();
            const filtered = searches.filter(search => search.id !== searchId);
            return manager.set(manager.config.recentSearches, filtered);
        }
    },
    
    // User settings management
    settings: {
        getAll() {
            const manager = window.StorageManager;
            const config = window.WeatherAppConfig;
            const defaults = {
                tempUnit: 'celsius',
                theme: 'light',
                notifications: true,
                autoRefresh: true,
                animations: true,
                language: 'en',
                dailySummary: false
            };
            
            return { ...defaults, ...manager.get(manager.config.userSettings, {}) };
        },
        
        get(key) {
            const settings = this.getAll();
            return settings[key];
        },
        
        set(key, value) {
            const manager = window.StorageManager;
            const settings = this.getAll();
            settings[key] = value;
            settings.lastUpdated = new Date().toISOString();
            
            return manager.set(manager.config.userSettings, settings);
        },
        
        update(newSettings) {
            const manager = window.StorageManager;
            const currentSettings = this.getAll();
            const updatedSettings = {
                ...currentSettings,
                ...newSettings,
                lastUpdated: new Date().toISOString()
            };
            
            return manager.set(manager.config.userSettings, updatedSettings);
        },
        
        reset() {
            const manager = window.StorageManager;
            return manager.remove(manager.config.userSettings);
        }
    },
    
    // Weather alerts management
    alerts: {
        getAll() {
            const manager = window.StorageManager;
            return manager.get('bps_weather_alerts', []);
        },
        
        add(alertData) {
            const manager = window.StorageManager;
            const alerts = this.getAll();
            
            const newAlert = {
                id: Date.now().toString(),
                locationId: alertData.locationId,
                locationName: alertData.locationName,
                alertType: alertData.alertType, // 'temperature', 'rain', 'wind', 'humidity'
                condition: alertData.condition, // 'above', 'below', 'equals'
                threshold: parseFloat(alertData.threshold),
                isActive: true,
                createdAt: new Date().toISOString(),
                lastTriggered: null,
                triggerCount: 0
            };
            
            alerts.push(newAlert);
            return manager.set('bps_weather_alerts', alerts);
        },
        
        remove(alertId) {
            const manager = window.StorageManager;
            const alerts = this.getAll();
            const filtered = alerts.filter(alert => alert.id !== alertId);
            return manager.set('bps_weather_alerts', filtered);
        },
        
        toggle(alertId) {
            const manager = window.StorageManager;
            const alerts = this.getAll();
            
            const alert = alerts.find(a => a.id === alertId);
            if (alert) {
                alert.isActive = !alert.isActive;
                alert.lastUpdated = new Date().toISOString();
                return manager.set('bps_weather_alerts', alerts);
            }
            
            return false;
        },
        
        checkAlerts(weatherData) {
            const alerts = this.getAll();
            const triggeredAlerts = [];
            
            alerts.forEach(alert => {
                if (!alert.isActive) return;
                
                let currentValue;
                let unit = '';
                
                switch (alert.alertType) {
                    case 'temperature':
                        currentValue = weatherData.current?.temp;
                        unit = '°C';
                        break;
                    case 'humidity':
                        currentValue = weatherData.current?.humidity;
                        unit = '%';
                        break;
                    case 'wind':
                        currentValue = weatherData.current?.wind_speed;
                        unit = ' km/h';
                        break;
                    case 'rain':
                        currentValue = weatherData.current?.rain || 0;
                        unit = ' mm';
                        break;
                    default:
                        return;
                }
                
                if (currentValue === undefined) return;
                
                let triggered = false;
                switch (alert.condition) {
                    case 'above':
                        triggered = currentValue > alert.threshold;
                        break;
                    case 'below':
                        triggered = currentValue < alert.threshold;
                        break;
                    case 'equals':
                        triggered = Math.abs(currentValue - alert.threshold) < 1;
                        break;
                }
                
                if (triggered) {
                    alert.lastTriggered = new Date().toISOString();
                    alert.triggerCount++;
                    
                    triggeredAlerts.push({
                        ...alert,
                        currentValue,
                        unit,
                        message: `${alert.locationName}: ${alert.alertType} is ${alert.condition} ${alert.threshold}${unit} (Current: ${currentValue}${unit})`
                    });
                }
            });
            
            if (triggeredAlerts.length > 0) {
                const manager = window.StorageManager;
                manager.set('bps_weather_alerts', alerts);
            }
            
            return triggeredAlerts;
        }
    },
    
    // User profile management (for mock auth)
    profile: {
        get() {
            const manager = window.StorageManager;
            return manager.get(manager.config.userProfile, null);
        },
        
        set(userData) {
            const manager = window.StorageManager;
            const profile = {
                ...userData,
                lastLogin: new Date().toISOString()
            };
            
            return manager.set(manager.config.userProfile, profile);
        },
        
        clear() {
            const manager = window.StorageManager;
            return manager.remove(manager.config.userProfile);
        },
        
        updateLastActivity() {
            const profile = this.get();
            if (profile) {
                profile.lastActivity = new Date().toISOString();
                return this.set(profile);
            }
            return false;
        }
    },
    
    // Authentication token management
    auth: {
        getToken() {
            const manager = window.StorageManager;
            return manager.get(manager.config.authToken, null);
        },
        
        setToken(token) {
            const manager = window.StorageManager;
            return manager.set(manager.config.authToken, {
                token,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            });
        },
        
        clearToken() {
            const manager = window.StorageManager;
            return manager.remove(manager.config.authToken);
        },
        
        isValidToken() {
            const tokenData = this.getToken();
            if (!tokenData) return false;
            
            const expiry = new Date(tokenData.expiresAt);
            return new Date() < expiry;
        }
    },
    
    // Export all data
    exportData() {
        const data = {
            favorites: this.favorites.getAll(),
            recentSearches: this.recentSearches.getAll(),
            settings: this.settings.getAll(),
            alerts: this.alerts.getAll(),
            profile: this.profile.get(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return data;
    },
    
    // Import data
    importData(data) {
        try {
            if (data.favorites) {
                this.set(this.config.favorites, data.favorites);
            }
            if (data.recentSearches) {
                this.set(this.config.recentSearches, data.recentSearches);
            }
            if (data.settings) {
                this.set(this.config.userSettings, data.settings);
            }
            if (data.alerts) {
                this.set('bps_weather_alerts', data.alerts);
            }
            if (data.profile) {
                this.profile.set(data.profile);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    },
    
    // Get storage usage info
    getStorageInfo() {
        const info = {
            favorites: this.favorites.getAll().length,
            recentSearches: this.recentSearches.getAll().length,
            alerts: this.alerts.getAll().length,
            hasProfile: !!this.profile.get(),
            hasAuth: !!this.auth.getToken(),
            totalKeys: Object.keys(localStorage).filter(key => 
                Object.values(this.config).includes(key) || key.startsWith('bps_weather_')
            ).length
        };
        
        // Calculate approximate storage size
        let totalSize = 0;
        Object.values(this.config).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) totalSize += item.length;
        });
        
        info.storageSize = `${Math.round(totalSize / 1024)} KB`;
        
        return info;
    }
};

// Initialize storage on load
document.addEventListener('DOMContentLoaded', function() {
    // Migrate old data if needed
    const oldKeys = ['weather_favorites', 'weather_recent', 'weather_settings'];
    const newKeys = Object.values(window.StorageManager.config);
    
    oldKeys.forEach((oldKey, index) => {
        const oldData = localStorage.getItem(oldKey);
        if (oldData && !localStorage.getItem(newKeys[index])) {
            localStorage.setItem(newKeys[index], oldData);
            localStorage.removeItem(oldKey);
            console.log(`Migrated ${oldKey} to ${newKeys[index]}`);
        }
    });
    
    console.log('Storage manager initialized');
});

// Export for use in other modules
window.StorageManager = StorageManager;