// Configuration for the BPS Weather App
window.WeatherAppConfig = {
    // OpenWeatherMap API configuration
    weather: {
        apiKey: 'YOUR_OPENWEATHERMAP_API_KEY', // Replace with actual API key
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        geocodingUrl: 'https://api.openweathermap.org/geo/1.0',
        units: 'metric',
        defaultCity: 'Delhi'
    },
    
    // App settings
    app: {
        name: 'BPS Weather App',
        version: '1.0.0',
        school: 'Vidya Niketan Birla Public School',
        location: 'Pilani, Rajasthan',
        maxFavorites: 10,
        maxRecentSearches: 10,
        cacheTimeout: 300000, // 5 minutes
        updateInterval: 60000   // 1 minute
    },
    
    // UI configuration
    ui: {
        theme: 'light', // 'light', 'dark', 'system'
        tempUnit: 'celsius', // 'celsius', 'fahrenheit'
        animations: true,
        notifications: true,
        autoRefresh: true
    },
    
    // Storage keys for localStorage
    storage: {
        favorites: 'bps_weather_favorites',
        recentSearches: 'bps_weather_recent',
        userSettings: 'bps_weather_settings',
        weatherCache: 'bps_weather_cache',
        authToken: 'bps_weather_auth',
        userProfile: 'bps_weather_profile'
    },
    
    // Weather condition mappings
    weatherIcons: {
        '01d': 'sun',           // clear sky day
        '01n': 'moon',          // clear sky night
        '02d': 'cloud-sun',     // few clouds day
        '02n': 'cloud-moon',    // few clouds night
        '03d': 'cloud',         // scattered clouds
        '03n': 'cloud',         // scattered clouds
        '04d': 'clouds',        // broken clouds
        '04n': 'clouds',        // broken clouds
        '09d': 'cloud-drizzle', // shower rain
        '09n': 'cloud-drizzle', // shower rain
        '10d': 'cloud-rain',    // rain day
        '10n': 'cloud-rain',    // rain night
        '11d': 'cloud-lightning', // thunderstorm
        '11n': 'cloud-lightning', // thunderstorm
        '13d': 'cloud-snow',    // snow
        '13n': 'cloud-snow',    // snow
        '50d': 'wind',          // mist
        '50n': 'wind'           // mist
    },
    
    // Popular cities for quick access
    popularCities: [
        { name: 'Delhi', country: 'IN', lat: 28.6139, lon: 77.2090 },
        { name: 'Mumbai', country: 'IN', lat: 19.0760, lon: 72.8777 },
        { name: 'Bangalore', country: 'IN', lat: 12.9716, lon: 77.5946 },
        { name: 'Chennai', country: 'IN', lat: 13.0827, lon: 80.2707 },
        { name: 'Kolkata', country: 'IN', lat: 22.5726, lon: 88.3639 },
        { name: 'Hyderabad', country: 'IN', lat: 17.3850, lon: 78.4867 },
        { name: 'Pune', country: 'IN', lat: 18.5204, lon: 73.8567 },
        { name: 'Ahmedabad', country: 'IN', lat: 23.0225, lon: 72.5714 },
        { name: 'Jaipur', country: 'IN', lat: 26.9124, lon: 75.7873 },
        { name: 'Surat', country: 'IN', lat: 21.1702, lon: 72.8311 }
    ],
    
    // Alert thresholds
    alerts: {
        temperature: {
            min: -10,
            max: 50,
            default: 25
        },
        humidity: {
            min: 0,
            max: 100,
            default: 70
        },
        windSpeed: {
            min: 0,
            max: 200,
            default: 50
        },
        rain: {
            min: 0,
            max: 500,
            default: 10
        }
    },
    
    // API endpoints for mock authentication (for static site)
    auth: {
        mockUser: {
            id: 'user_demo_12345',
            email: 'student@bps.edu.in',
            firstName: 'Student',
            lastName: 'User',
            profileImageUrl: '',
            preferences: {
                tempUnit: 'celsius',
                notifications: true,
                theme: 'light'
            },
            createdAt: new Date().toISOString()
        }
    },
    
    // Error messages
    messages: {
        errors: {
            networkError: 'Network error. Please check your connection and try again.',
            apiError: 'Unable to fetch weather data. Please try again later.',
            locationNotFound: 'Location not found. Please check the spelling and try again.',
            apiKeyMissing: 'Weather API key not configured. Please contact administrator.',
            geoLocationFailed: 'Unable to get your location. Please search for a city manually.',
            saveFailed: 'Unable to save data. Please try again.',
            loadFailed: 'Unable to load saved data.',
            authFailed: 'Authentication failed. Please try again.',
            maxFavoritesReached: `You can only have ${this.app?.maxFavorites || 10} favorite locations.`
        },
        success: {
            locationAdded: 'Location added to favorites!',
            locationRemoved: 'Location removed from favorites!',
            settingsSaved: 'Settings saved successfully!',
            alertCreated: 'Weather alert created successfully!',
            alertRemoved: 'Weather alert removed!',
            dataExported: 'Data exported successfully!',
            cacheCleared: 'Search history cleared!'
        }
    },
    
    // Feature flags for enabling/disabling functionality
    features: {
        geolocation: true,
        favorites: true,
        alerts: true,
        maps: false, // Set to false for static site
        push: false, // Set to false for static site
        auth: true,  // Mock auth for demo
        export: true,
        themes: true,
        animations: true
    }
};

// Utility functions for configuration
window.WeatherAppConfig.utils = {
    // Get weather icon name from OpenWeather icon code
    getWeatherIcon(iconCode) {
        return this.weatherIcons[iconCode] || 'sun';
    },
    
    // Convert temperature between units
    convertTemperature(temp, fromUnit, toUnit) {
        if (fromUnit === toUnit) return temp;
        
        if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
            return (temp * 9/5) + 32;
        }
        if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
            return (temp - 32) * 5/9;
        }
        return temp;
    },
    
    // Format temperature display
    formatTemperature(temp, unit = 'celsius') {
        const rounded = Math.round(temp);
        const symbol = unit === 'celsius' ? '°C' : '°F';
        return `${rounded}${symbol}`;
    },
    
    // Format date
    formatDate(date) {
        return new Intl.DateTimeFormat('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    },
    
    // Format time
    formatTime(time) {
        return new Intl.DateTimeFormat('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(new Date(time));
    },
    
    // Validate API key
    validateApiKey(apiKey) {
        return apiKey && apiKey !== 'YOUR_OPENWEATHERMAP_API_KEY' && apiKey.length > 10;
    },
    
    // Check if feature is enabled
    isFeatureEnabled(feature) {
        return this.features[feature] === true;
    }
};

// Initialize configuration
document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem(WeatherAppConfig.storage.userSettings);
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            Object.assign(WeatherAppConfig.ui, settings);
        } catch (e) {
            console.warn('Failed to load saved settings:', e);
        }
    }
    
    // Apply theme
    document.body.setAttribute('data-theme', WeatherAppConfig.ui.theme);
    
    // Set up console warning for missing API key
    if (!WeatherAppConfig.utils.validateApiKey(WeatherAppConfig.weather.apiKey)) {
        console.warn('⚠️ Weather API key not configured. Please set your OpenWeatherMap API key in scripts/config.js');
        console.info('Get your free API key at: https://openweathermap.org/api');
    }
    
    console.info(`🌤️ ${WeatherAppConfig.app.name} v${WeatherAppConfig.app.version} initialized`);
});