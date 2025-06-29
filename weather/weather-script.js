const iconElement = document.querySelector(".icon");
const weatherCityCountry = document.querySelector(".weather-city-country");
const temperatureElement = document.querySelector(".temperature");
const descriptionElement = document.querySelector(".description");
const humidityElement = document.querySelector(".humidity");
const windSpeedElement = document.querySelector(".wind-speed");
const feelsLikeElement = document.querySelector(".feels-like");
const weatherBox = document.querySelector(".weather-box");
const errorMessage = document.querySelector(".error-message");
const loadingSpinner = document.querySelector(".loading-spinner");
const unitBtns = document.querySelectorAll(".unit-btn");
const extraInfo = document.querySelector(".extra-info");
const flagElement = document.querySelector(".flag");

const API_KEY = '1f57860d16f50991ec43e06ab65ffb6e'; // Your OpenWeatherMap API Key

let currentUnit = "C";
let lastWeatherData = null;

// Get city name from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const cityFromUrl = urlParams.get('city');

// Event Listeners
unitBtns.forEach(btn => {
    btn.addEventListener("click", function() {
        if (!this.classList.contains("active")) {
            unitBtns.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentUnit = this.getAttribute("data-unit");
            if (lastWeatherData) {
                renderWeather(lastWeatherData); // re-render with new unit
            }
        }
    });
});

// Utility Functions
function displayError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add("show");
    weatherBox.classList.remove("show");
    loadingSpinner.classList.remove("show");
}

function hideError() {
    errorMessage.classList.remove("show");
}

function showLoading() {
    loadingSpinner.classList.add("show");
    weatherBox.classList.remove("show");
    hideError();
}

function hideLoading() {
    loadingSpinner.classList.remove("show");
    weatherBox.classList.add("show");
}

// Fetch Weather Data
async function getWeather(city) {
    showLoading();
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("City not found. Please check the spelling.");
            } else {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
        }
        const data = await response.json();
        lastWeatherData = data;
        renderWeather(data);
        hideLoading();
        hideError();
    } catch (error) {
        console.error("Error fetching weather data:", error);
        displayError(error.message || "Could not fetch weather data. Please try again later.");
        loadingSpinner.classList.remove("show");
    }
}

// Render Weather Data to DOM
function renderWeather(data) {
    const iconCode = data.weather[0].icon;
    iconElement.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${data.weather[0].description} icon"/>`;

    const weatherCity = data.name;
    const weatherCountry = data.sys.country;
    weatherCityCountry.textContent = `${weatherCity}, ${weatherCountry}`;
    flagElement.textContent = getFlagEmoji(weatherCountry);

    let temp = data.main.temp;
    let feels = data.main.feels_like;
    let tempValue, feelsValue, windValue, unitSymbol;

    if (currentUnit === "F") {
        tempValue = (temp - 273.15) * 9/5 + 32;
        feelsValue = (feels - 273.15) * 9/5 + 32;
        windValue = (data.wind.speed * 2.23694).toFixed(1); // m/s to mph
        unitSymbol = "°F";
    } else {
        tempValue = temp - 273.15;
        feelsValue = feels - 273.15;
        windValue = (data.wind.speed * 3.6).toFixed(1); // m/s to km/h
        unitSymbol = "°C";
    }

    temperatureElement.innerHTML = `${tempValue.toFixed(1)}${unitSymbol}`;
    const weatherDesc = data.weather[0].description;
    descriptionElement.innerHTML = capitalizeFirstLetter(weatherDesc);

    humidityElement.innerHTML = `${data.main.humidity}%`;
    windSpeedElement.innerHTML = `${windValue} ${currentUnit === "F" ? "mph" : "km/h"}`;
    feelsLikeElement.innerHTML = `${feelsValue.toFixed(1)}${unitSymbol}`;

    let min = data.main.temp_min, max = data.main.temp_max;
    let sunrise = data.sys.sunrise, sunset = data.sys.sunset;
    let minT, maxT;

    if (currentUnit === "F") {
        minT = ((min - 273.15) * 9/5 + 32).toFixed(1) + "°F";
        maxT = ((max - 273.15) * 9/5 + 32).toFixed(1) + "°F";
    } else {
        minT = (min - 273.15).toFixed(1) + "°C";
        maxT = (max - 273.15).toFixed(1) + "°C";
    }
    let sunriseText = unixToTime(sunrise, data.timezone);
    let sunsetText = unixToTime(sunset, data.timezone);

    extraInfo.innerHTML = `
        <div>Min: <span>${minT}</span></div>
        <div>Max: <span>${maxT}</span></div>
        <div>Sunrise: <span>${sunriseText}</span></div>
        <div>Sunset: <span>${sunsetText}</span></div>
    `;
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper function to convert Unix timestamp to local time
function unixToTime(unixTimestamp, timezoneOffset) {
    const date = new Date((unixTimestamp + timezoneOffset) * 1000);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

// Helper function to get country flag emoji
function getFlagEmoji(countryCode) {
    if (!countryCode) return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 0x1F1E6 + char.charCodeAt(0) - 'A'.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

// Initial call for weather details page
if (cityFromUrl) {
    getWeather(cityFromUrl);
} else {
    displayError("No city specified. Please return to the home page to search.");
}