// Map and Layer Definitions
var map, layerControl;
var bordersLayerGroup = L.layerGroup();
var cityMarkersCluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    polygonOptions: {
        fillColor: "#FF0000",
        color: "#000",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.5
    }
});
var adminCityClusterGroup = L.markerClusterGroup({
    maxClusterRadius: 25
});

// Set up the map with default tile layers
var streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
});

var baseMaps = {
    "Streets": streets,
    "Satellite": satellite,
};

// Add markers for overlays
var overlayMaps = {
    "Administrative Cities": adminCityClusterGroup,
    "Cities": cityMarkersCluster,
};

var countryBorderLayerRef = { specificCountry: null };
var activeCoordinates = { lat: null, lon: null };

// Initialize the map
$(document).ready(function () {
    $('#preloader').show();

    // Initialize the map with Leaflet
    map = L.map("map", {
        layers: [streets],  // Default view with streets
        maxZoom: 18,
    }).fitWorld();

    // Add layer control to the map
    layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    // Add map buttons
    addMapButtons();

    // Use geolocation to detect user's location and center the map
    map.locate({
        setView: true,
        maxZoom: 6,
        watch: false,
        enableHighAccuracy: true
    });

    $(window).on('load', function() {
        // Hide preloader once the page is fully loaded
        $('#preloader').fadeOut('slow', function() {
            $(this).remove();
        });
    });

    // When location is found, handle user location and load borders
    map.on('locationfound', function (e) {
        handleUserLocation(e.latlng.lat, e.latlng.lng);
        activeCoordinates.lat = e.latlng.lat;
        activeCoordinates.lon = e.latlng.lng;
        $('#preloader').fadeOut('slow', function() {
            $(this).remove();
        });
    });

    // Handle location error
    map.on('locationerror', function (e) {
        showAlert(e.message, 'warning');
        $('#preloader').fadeOut('slow', function() {
            $(this).remove();
        });
    });

    // When country is selected from the dropdown
    $('#countrySelect').on('change', function () {
        const isoCode = $(this).val();
        getCountrySpecificBorders(isoCode)
            .then(() => {
                loadCitiesForCountry(isoCode);
            })
            .catch((error) => {
                showAlert('Error fetching borders:', 'danger');
            });
        setCountryInform(isoCode);
    });
});

// ---------------------------------------------------------
// Function Definitions
// ---------------------------------------------------------

// Add map buttons
function addMapButtons() {
    // Location Button
    L.easyButton('<img src="Images/cities.png" width="20" height="20">', function(btn, map) {
        map.locate({ setView: false });
    }).addTo(map);

    // Country Info Button
    L.easyButton('<img src="Images/Wiki.png" width="20" height="20">', function () {
        const countryModal = new bootstrap.Modal($('#countryModal')[0]);
        countryModal.show();
    }).addTo(map);

    // Currency Button
    L.easyButton('<img src="Images/currency.png" width="20" height="20">', function () {
        const currencyCode = $('#curenCurrencyCodeConverter').text();
        if (!currencyCode) {
            showAlert('Currency data is not available. Please try again later.', 'warning');
            return;
        }
        getCurrencyData(currencyCode);
        const currencyModal = new bootstrap.Modal($('#currencyModal')[0]);
        currencyModal.show();
    }).addTo(map);

    // Weather Button
    L.easyButton('<img src="Images/weather.png" width="20" height="20">', function () {
        if (activeCoordinates.lat && activeCoordinates.lon) {
            getWeatherData(activeCoordinates.lat, activeCoordinates.lon, '');
        } else {
            showAlert('Sorry, the location is not defined.', 'danger');
        }
        const weatherModal = new bootstrap.Modal($('#weatherModal')[0]);
        weatherModal.show();
    }).addTo(map);
}

// Handle user location after detection
function handleUserLocation(lat, lon) {
    $.ajax({
        url: 'Php/getWeather.php',  // Fetch weather for current location
        method: 'GET',
        data: { lat: lat, lon: lon },
        dataType: 'json',
        success: function (data) {
            const isoCode = data.countryISO;  // Assuming weather API returns countryISO
            $('#countrySelect').val(isoCode).change();
            $('#preloader').fadeOut('slow');
        },
        error: function () {
            showAlert('Error fetching location', 'danger');
            $('#preloader').fadeOut('slow');
        }
    });
}

// Load borders for selected country
function getCountrySpecificBorders(isoCode) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: 'Data/countryBorders.geo.json',
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                const specificCountryLayer = L.geoJSON(data, {
                    filter: function (feature) {
                        return feature.properties.iso_a2 === isoCode;  // Filter by ISO code
                    },
                    style: {
                        color: '#0000FF',
                        weight: 2,
                        fillOpacity: 0.2,
                    }
                });

                if (countryBorderLayerRef.specificCountry) {
                    map.removeLayer(countryBorderLayerRef.specificCountry);
                    countryBorderLayerRef.specificCountry = null;
                }

                countryBorderLayerRef.specificCountry = specificCountryLayer.addTo(map);
                map.fitBounds(specificCountryLayer.getBounds());
                resolve();
            },
            error: function (error) {
                reject(error);
            }
        });
    });
}

// Set country information in modal
function setCountryInform(isoCode) {
    $.ajax({
        url: 'Php/countryName.php',
        method: 'GET',
        data: { isoCode: isoCode },
        dataType: 'json',
        success: function (data) {
            $('#countryName').text(data.name);
            $('#capital').text(data.capital);
            $('#population').text(data.population);
            $('#currency').text(data.currency);
            $('#timezone').text(data.timezones);
        },
        error: function () {
            showAlert('Error fetching country info', 'danger');
        }
    });
}

// Fetch weather data for a given location
function getWeatherData(lat, lon, locationName) {
    $.ajax({
        url: 'Php/getWeather.php',
        method: 'GET',
        data: { lat: lat, lon: lon },
        dataType: 'json',
        success: function (data) {
            $('#weather-point-name').text(locationName || data.name);
            $('#weather-description').text(data.weatherDescription);
            $('#weather-temp').text(data.temp + ' °C');
        },
        error: function () {
            showAlert('Error fetching weather data.', 'danger');
        }
    });
}

// Display alert message
function showAlert(message, alertType = 'success') {
    const $alertPlaceholder = $('#alertPlaceholder');
    const $alertHtml = $(`<div class="alert alert-${alertType}">${message}</div>`);
    $alertPlaceholder.html($alertHtml);
    setTimeout(() => $alertPlaceholder.empty(), 3000);
}
