// Weather API service for BPS Weather App
window.WeatherAPI = {
    // Cache for API responses
    cache: new Map(),
    
    // Make API request with error handling
    async makeRequest(url, options = {}) {
        try {
            console.log('Making API request to:', url);
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    },
    
    // Get current weather by city name
    async getCurrentWeather(cityName) {
        const config = window.WeatherAppConfig;
        
        if (!config.utils.validateApiKey(config.weather.apiKey)) {
            throw new Error(config.messages.errors.apiKeyMissing);
        }
        
        const cacheKey = `current_${cityName}_${config.weather.units}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            console.log('Using cached weather data for:', cityName);
            return cached;
        }
        
        try {
            const url = `${config.weather.baseUrl}/weather?q=${encodeURIComponent(cityName)}&appid=${config.weather.apiKey}&units=${config.weather.units}`;
            const data = await this.makeRequest(url);
            
            const weatherData = this.transformCurrentWeather(data);
            this.setCachedData(cacheKey, weatherData);
            
            return weatherData;
        } catch (error) {
            if (error.message.includes('404')) {
                throw new Error(config.messages.errors.locationNotFound);
            }
            throw new Error(config.messages.errors.apiError);
        }
    },
    
    // Get weather forecast
    async getForecast(cityName) {
        const config = window.WeatherAppConfig;
        
        if (!config.utils.validateApiKey(config.weather.apiKey)) {
            throw new Error(config.messages.errors.apiKeyMissing);
        }
        
        const cacheKey = `forecast_${cityName}_${config.weather.units}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            console.log('Using cached forecast data for:', cityName);
            return cached;
        }
        
        try {
            const url = `${config.weather.baseUrl}/forecast?q=${encodeURIComponent(cityName)}&appid=${config.weather.apiKey}&units=${config.weather.units}`;
            const data = await this.makeRequest(url);
            
            const forecastData = this.transformForecast(data);
            this.setCachedData(cacheKey, forecastData);
            
            return forecastData;
        } catch (error) {
            if (error.message.includes('404')) {
                throw new Error(config.messages.errors.locationNotFound);
            }
            throw new Error(config.messages.errors.apiError);
        }
    },
    
    // Get complete weather data (current + forecast)
    async getCompleteWeather(cityName) {
        try {
            const [currentWeather, forecast] = await Promise.all([
                this.getCurrentWeather(cityName),
                this.getForecast(cityName)
            ]);
            
            // Combine current weather with forecast
            return {
                location: currentWeather.location,
                current: currentWeather.current,
                hourly: forecast.hourly.slice(0, 24), // Next 24 hours
                daily: forecast.daily.slice(0, 5)     // Next 5 days
            };
        } catch (error) {
            console.error('Failed to get complete weather:', error);
            throw error;
        }
    },
    
    // Get weather by coordinates
    async getWeatherByCoords(lat, lon) {
        const config = window.WeatherAppConfig;
        
        if (!config.utils.validateApiKey(config.weather.apiKey)) {
            throw new Error(config.messages.errors.apiKeyMissing);
        }
        
        const cacheKey = `coords_${lat}_${lon}_${config.weather.units}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            console.log('Using cached weather data for coordinates:', lat, lon);
            return cached;
        }
        
        try {
            const [currentUrl, forecastUrl] = [
                `${config.weather.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${config.weather.apiKey}&units=${config.weather.units}`,
                `${config.weather.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${config.weather.apiKey}&units=${config.weather.units}`
            ];
            
            const [currentData, forecastData] = await Promise.all([
                this.makeRequest(currentUrl),
                this.makeRequest(forecastUrl)
            ]);
            
            const weatherData = {
                location: this.transformLocation(currentData),
                current: this.transformCurrent(currentData),
                hourly: this.transformHourly(forecastData.list.slice(0, 8)),
                daily: this.transformDaily(forecastData.list)
            };
            
            this.setCachedData(cacheKey, weatherData);
            return weatherData;
        } catch (error) {
            throw new Error(config.messages.errors.apiError);
        }
    },
    
    // Search cities for autocomplete
    async searchCities(query) {
        const config = window.WeatherAppConfig;
        
        if (!config.utils.validateApiKey(config.weather.apiKey)) {
            // Return popular cities if no API key
            return config.popularCities.filter(city => 
                city.name.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5);
        }
        
        try {
            const url = `${config.weather.geocodingUrl}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${config.weather.apiKey}`;
            const data = await this.makeRequest(url);
            
            return data.map(item => ({
                name: item.name,
                country: item.country,
                state: item.state,
                lat: item.lat,
                lon: item.lon
            }));
        } catch (error) {
            console.warn('City search failed, using popular cities:', error);
            return config.popularCities.filter(city => 
                city.name.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5);
        }
    },
    
    // Transform OpenWeatherMap current weather data
    transformCurrentWeather(data) {
        const config = window.WeatherAppConfig;
        
        return {
            location: {
                name: data.name,
                country: data.sys.country,
                lat: data.coord.lat,
                lon: data.coord.lon
            },
            current: {
                temp: Math.round(data.main.temp),
                feels_like: Math.round(data.main.feels_like),
                temp_min: Math.round(data.main.temp_min),
                temp_max: Math.round(data.main.temp_max),
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                wind_speed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
                wind_deg: data.wind.deg,
                wind_direction: this.getWindDirection(data.wind.deg),
                visibility: Math.round((data.visibility || 10000) / 1000), // Convert to km
                condition: data.weather[0].main,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                uv_index: 0, // Not available in current weather API
                clouds: data.clouds.all,
                rain: data.rain ? data.rain['1h'] || 0 : 0,
                precipitation: data.rain ? data.rain['1h'] || 0 : 0,
                date: new Date().toISOString(),
                sunrise: new Date(data.sys.sunrise * 1000).toTimeString().slice(0, 5),
                sunset: new Date(data.sys.sunset * 1000).toTimeString().slice(0, 5),
                day_length: this.calculateDayLength(data.sys.sunrise, data.sys.sunset)
            }
        };
    },
    
    // Transform forecast data
    transformForecast(data) {
        return {
            hourly: this.transformHourly(data.list.slice(0, 8)),
            daily: this.transformDaily(data.list)
        };
    },
    
    // Transform hourly forecast
    transformHourly(hourlyList) {
        return hourlyList.map(item => ({
            time: new Date(item.dt * 1000).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            temp: Math.round(item.main.temp),
            icon: item.weather[0].icon,
            condition: item.weather[0].main,
            description: item.weather[0].description
        }));
    },
    
    // Transform daily forecast
    transformDaily(dailyList) {
        const dailyData = {};
        
        // Group by day
        dailyList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                    date: date.toISOString().split('T')[0],
                    day: date.toLocaleDateString('en-IN', { weekday: 'long' }),
                    temps: [],
                    conditions: [],
                    humidity: [],
                    wind_speeds: []
                };
            }
            
            dailyData[dayKey].temps.push(item.main.temp);
            dailyData[dayKey].conditions.push(item.weather[0]);
            dailyData[dayKey].humidity.push(item.main.humidity);
            dailyData[dayKey].wind_speeds.push(item.wind.speed);
        });
        
        // Process daily data
        return Object.values(dailyData).slice(0, 5).map(day => {
            const temps = day.temps;
            const mostCommonCondition = this.getMostCommonCondition(day.conditions);
            
            return {
                date: day.date,
                day: day.day,
                temp_max: Math.round(Math.max(...temps)),
                temp_min: Math.round(Math.min(...temps)),
                icon: mostCommonCondition.icon,
                condition: mostCommonCondition.main,
                description: mostCommonCondition.description,
                humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
                wind_speed: Math.round((day.wind_speeds.reduce((a, b) => a + b, 0) / day.wind_speeds.length) * 3.6)
            };
        });
    },
    
    // Get wind direction from degrees
    getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                           'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    },
    
    // Calculate day length
    calculateDayLength(sunriseTimestamp, sunsetTimestamp) {
        const sunrise = new Date(sunriseTimestamp * 1000);
        const sunset = new Date(sunsetTimestamp * 1000);
        const diffMs = sunset - sunrise;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffHours}h ${diffMinutes}m`;
    },
    
    // Get most common weather condition
    getMostCommonCondition(conditions) {
        const conditionCount = {};
        conditions.forEach(condition => {
            const key = condition.main;
            conditionCount[key] = (conditionCount[key] || 0) + 1;
        });
        
        const mostCommon = Object.keys(conditionCount).reduce((a, b) => 
            conditionCount[a] > conditionCount[b] ? a : b
        );
        
        return conditions.find(c => c.main === mostCommon);
    },
    
    // Cache management
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < window.WeatherAppConfig.app.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    },
    
    setCachedData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    },
    
    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('Weather cache cleared');
    },
    
    // Get user's current location weather
    async getCurrentLocationWeather() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const weather = await this.getWeatherByCoords(latitude, longitude);
                        resolve(weather);
                    } catch (error) {
                        reject(error);
                    }
                },
                (error) => {
                    reject(new Error(window.WeatherAppConfig.messages.errors.geoLocationFailed));
                },
                {
                    timeout: 10000,
                    enableHighAccuracy: true
                }
            );
        });
    }
};

// Export for use in other modules
window.WeatherAPI = WeatherAPI;