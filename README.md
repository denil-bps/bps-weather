# BPS Weather App - Static Version

A comprehensive weather application for **Vidya Niketan Birla Public School**, Pilani, built entirely with HTML, CSS, and JavaScript.

## 🌟 Features

- **Real-time Weather Data**: Current conditions, hourly & 5-day forecasts
- **Interactive Search**: City search with autocomplete suggestions
- **User Authentication**: Demo authentication system with persistent sessions
- **Favorites Management**: Save and manage favorite locations
- **Weather Alerts**: Set custom alerts for temperature, humidity, wind, and rain
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Offline Storage**: All user data stored locally in browser
- **School Branding**: Official BPS colors and branding throughout

## 🚀 Getting Started

### Option 1: Open Directly
Simply open `index.html` in any modern web browser. The app will work immediately with demo data.

### Option 2: Local Server (Recommended)
For full functionality including API features, run a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## ⚙️ Configuration

### Weather API Setup
1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Open `scripts/config.js`
3. Replace `YOUR_OPENWEATHERMAP_API_KEY` with your actual API key:

```javascript
weather: {
    apiKey: 'your-actual-api-key-here',
    // ... other settings
}
```

### Customization
All configuration is in `scripts/config.js`:
- **School Information**: Update school name and location
- **Popular Cities**: Modify the list of quick-access cities  
- **UI Settings**: Change theme, units, and behavior defaults
- **Feature Flags**: Enable/disable specific functionality

## 📁 Project Structure

```
static-weather-app/
├── index.html                 # Main HTML file
├── assets/
│   └── bps-logo.png          # School logo
├── styles/
│   ├── main.css              # Core styles and layout
│   ├── components.css        # UI component styles
│   └── animations.css        # Weather animations
└── scripts/
    ├── config.js             # Configuration settings
    ├── weather-api.js        # Weather API integration
    ├── storage.js            # Local storage management
    ├── auth.js               # Authentication system
    ├── components.js         # UI components and functionality
    └── app.js                # Main application coordination
```

## 🎯 Key Functionality

### Weather Data
- **Current Weather**: Temperature, conditions, humidity, wind speed, pressure
- **Hourly Forecast**: Next 24 hours with detailed conditions
- **5-Day Forecast**: Extended outlook with daily highs/lows
- **Location Search**: Find weather for any city worldwide
- **Geolocation**: Use current location for instant weather

### User Features
- **Authentication**: Sign in to access personalized features
- **Favorites**: Save frequently checked locations
- **Weather Alerts**: Get notified when conditions meet your criteria
- **Settings**: Customize temperature units, theme, and preferences
- **Dashboard**: Overview of favorites, alerts, and recent searches

### Technical Features
- **Responsive Design**: Mobile-first approach with breakpoints
- **Progressive Enhancement**: Works without JavaScript for basic content
- **Local Storage**: All user data persists between sessions
- **Caching**: Smart API caching reduces unnecessary requests
- **Error Handling**: Graceful degradation for offline/API failures

## 🎨 Design System

### Colors (BPS Theme)
- **Primary**: Blue (#3B82F6) - School's primary color
- **Secondary**: Orange (#F59E0B) - School's accent color  
- **Background**: White/Light gray for clean, academic look
- **Text**: Dark gray for excellent readability

### Typography
- **Font Family**: Inter (Google Fonts) for modern, clean appearance
- **Hierarchy**: Clear sizing and weights for different content levels
- **Responsive**: Scales appropriately across device sizes

### Components
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Clear actions with hover states
- **Forms**: Accessible inputs with proper labels
- **Animations**: Smooth, purposeful transitions

## 🔧 Browser Support

**Fully Supported:**
- Chrome 80+ 
- Firefox 75+
- Safari 13+
- Edge 80+

**Partially Supported:**
- Internet Explorer 11 (no animations, basic functionality only)

**Required Features:**
- ES6+ support
- Local Storage
- Fetch API
- CSS Grid & Flexbox

## 📱 Mobile Experience

The app is fully responsive and optimized for mobile devices:
- **Touch-friendly**: Large tap targets and smooth scrolling
- **Fast Loading**: Optimized assets and minimal dependencies
- **Offline Support**: Core functionality works without internet
- **App-like Feel**: Full-screen experience with smooth animations

## 🔐 Privacy & Security

- **No Server**: All data stays on your device
- **Local Storage**: User preferences and favorites stored in browser
- **API Security**: Weather API key can be kept client-side safely
- **No Tracking**: No analytics or third-party tracking scripts

## 🎓 Educational Use

Perfect for educational environments:
- **Safe**: No external dependencies or tracking
- **Fast**: Loads quickly on school networks
- **Accessible**: Screen reader compatible and keyboard navigable
- **Educational**: Great for teaching web development concepts

## 🛠️ Development

### Adding Features
1. **New Components**: Add to `scripts/components.js`
2. **Styling**: Update appropriate CSS files
3. **Configuration**: Extend `scripts/config.js` as needed
4. **Storage**: Add new data types to `scripts/storage.js`

### Customization Examples
```javascript
// Change default city
WeatherAppConfig.weather.defaultCity = 'Jaipur';

// Add more popular cities
WeatherAppConfig.popularCities.push({
    name: 'Udaipur', 
    country: 'IN', 
    lat: 24.5854, 
    lon: 73.7125
});

// Modify color scheme
:root {
    --primary: #8B5CF6; /* Purple theme */
    --secondary: #EC4899; /* Pink accent */
}
```

## 📄 License

This project is created for educational purposes for Vidya Niketan Birla Public School, Pilani.

## 🤝 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify API key configuration
3. Ensure modern browser with required features
4. Check internet connection for API features

---

**Made with ❤️ for Vidya Niketan Birla Public School, Pilani**