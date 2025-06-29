const citySearchInput = document.getElementById("citySearchInput");
const searchBtn = document.getElementById("searchBtn");
const myLocationBtn = document.getElementById("myLocationBtn");
const homeLoadingSpinner = document.getElementById("homeLoadingSpinner");
const homeErrorMessage = document.getElementById("homeErrorMessage");
const dateTimeElement = document.querySelector(".date-time");
const cityGrid = document.querySelector(".city-grid");
const currentYearSpan = document.getElementById("currentYear");

const API_KEY = '1f57860d16f50991ec43e06ab65ffb6e'; // Your OpenWeatherMap API Key

// Featured cities to display
const featuredCities = [
    { name: "Dehli"},
    { name: "Mumbai"},
    { name: "Uttar Pradesh"},
    { name: "Uttarakhand"},
    { name: "Himachal Pradesh"},
    { name: "Madhya Pradesh"}
];

// Event Listeners
searchBtn.addEventListener("click", () => {
    const city = citySearchInput.value.trim();
    if (city) {
        navigateToWeatherPage(city);
    } else {
        displayHomeError("Please enter a city name.");
    }
});

citySearchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        searchBtn.click();
    }
});

myLocationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        showHomeLoading();
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getCityNameFromCoords(lat, lon);
            },
            error => {
                hideHomeLoading();
                let message = "Unable to retrieve your location.";
                if (error.code === error.PERMISSION_DENIED) {
                    message = "Location access denied. Please enable it in your browser settings.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message = "Location information is unavailable.";
                } else if (error.code === error.TIMEOUT) {
                    message = "The request to get user location timed out.";
                }
                displayHomeError(message);
            }
        );
    } else {
        displayHomeError("Geolocation is not supported by your browser.");
    }
});


// Utility Functions for Home Page
function displayHomeError(message) {
    homeErrorMessage.textContent = message;
    homeErrorMessage.classList.add("show");
    homeLoadingSpinner.classList.remove("show");
}

function hideHomeError() {
    homeErrorMessage.classList.remove("show");
}

function showHomeLoading() {
    homeLoadingSpinner.classList.add("show");
    hideHomeError();
}

function hideHomeLoading() {
    homeLoadingSpinner.classList.remove("show");
}

function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    dateTimeElement.textContent = now.toLocaleDateString('en-US', options);
}

function navigateToWeatherPage(city) {
    window.location.href = `weather.html?city=${encodeURIComponent(city)}`;
}

async function getCityNameFromCoords(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        hideHomeLoading();
        navigateToWeatherPage(data.name); // Navigate using the city name
    } catch (error) {
        console.error("Error fetching city name from coordinates:", error);
        displayHomeError("Could not determine city from your location.");
        hideHomeLoading();
    }
}

async function fetchFeaturedCityTemp(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city.name}&appid=${API_KEY}&units=metric`); // Using metric for simplicity
        if (!response.ok) {
            throw new Error(`Error fetching temp for ${city.name}`);
        }
        const data = await response.json();
        return {
            name: city.name,
            temp: data.main.temp.toFixed(0), // Round to whole number
            icon: data.weather[0].icon
        };
    } catch (error) {
        console.error(error);
        return { name: city.name, temp: '--', icon: '01d' }; // Fallback
    }
}

async function loadFeaturedCities() {
    const cityPromises = featuredCities.map(city => fetchFeaturedCityTemp(city));
    const cityData = await Promise.all(cityPromises);

    cityGrid.innerHTML = ''; // Clear existing
    cityData.forEach(data => {
        const cityCard = document.createElement('div');
        cityCard.classList.add('city-card');
        cityCard.innerHTML = `
            <div class="city-name">${data.name}</div>
            <img src="https://openweathermap.org/img/wn/${data.icon}.png" alt="Weather icon">
            <div class="city-temp">${data.temp}°C</div>
        `;
        cityCard.addEventListener('click', () => navigateToWeatherPage(data.name));
        cityGrid.appendChild(cityCard);
    });
}

// Initial calls
updateDateTime();
setInterval(updateDateTime, 60000); // Update time every minute
loadFeaturedCities();
currentYearSpan.textContent = new Date().getFullYear();