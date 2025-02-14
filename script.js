const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherInfo = document.querySelector('.weather-info');

// Replace 'YOUR_API_KEY' with your actual OpenWeatherMap API key
const apiKey = 'c5f7284d47b8a66c61a19a9df4a8654b';  // Replace with your actual API key from OpenWeatherMap

async function getWeather(city) {
    try {
        // Show loading state
        weatherInfo.innerHTML = '<div class="loading">Loading...</div>';
        weatherInfo.classList.add('active');

        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
        console.log('Fetching from URL:', url);

        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Error fetching weather data');
        }

        displayWeather(data);
    } catch (error) {
        console.error('Error details:', error);
        weatherInfo.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

function displayWeather(data) {
    // Convert timestamps to local time
    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString();

    // Calculate wind direction
    const windDirection = getWindDirection(data.wind.deg);

    weatherInfo.innerHTML = `
        <div class="city-name">${data.name}, ${data.sys.country}</div>
        
        <div class="weather-icon">
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png" 
                 alt="weather icon" 
                 id="weather-icon">
        </div>
        
        <div class="temperature">
            ${Math.round(data.main.temp)}°C
            <span class="feels-like">
                (Feels like: ${Math.round(data.main.feels_like)}°C)
            </span>
        </div>
        
        <div class="description">
            ${data.weather[0].description.charAt(0).toUpperCase() + 
            data.weather[0].description.slice(1)}
        </div>
        
        <div class="details">
            <div class="detail-item">
                <i class="fas fa-tint"></i>
                <span>Humidity</span>
                <span>${data.main.humidity}%</span>
            </div>
            
            <div class="detail-item">
                <i class="fas fa-wind"></i>
                <span>Wind</span>
                <span>${Math.round(data.wind.speed * 3.6)} km/h ${windDirection}</span>
            </div>
            
            <div class="detail-item">
                <i class="fas fa-compress-arrows-alt"></i>
                <span>Pressure</span>
                <span>${data.main.pressure} hPa</span>
            </div>
            
            <div class="detail-item">
                <i class="fas fa-eye"></i>
                <span>Visibility</span>
                <span>${(data.visibility / 1000).toFixed(1)} km</span>
            </div>
            
            <div class="detail-item">
                <i class="fas fa-sun"></i>
                <span>Sunrise</span>
                <span>${sunrise}</span>
            </div>
            
            <div class="detail-item">
                <i class="fas fa-moon"></i>
                <span>Sunset</span>
                <span>${sunset}</span>
            </div>
        </div>
    `;
}

function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Event listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    }
});

cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeather(city);
        }
    }
});
