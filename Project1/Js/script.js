// script.js

// ---------------------------------------------------------
// GLOBAL DECLARATIONS
// ---------------------------------------------------------

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
var placeMarker = null; // marker to indicate the places we were looking for

// tile layers

var streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}); 

var satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    }
);

var baseMaps = {
    "Streets": streets,
    "Satellite": satellite,
};

var overlayMaps = {
    "Administrative Cities": adminCityClusterGroup,
    "Cities": cityMarkersCluster,
};

var countryBorderLayerRef = { specificCountry: null}; 
var activeCoordinates = { lat: null, lon: null };

// buttons

// user location
var locationBtn = L.easyButton('<img src="images/home.png" width="20" height="20">', function(btn, map) {
    map.locate({setView: false}); // find the location and do not move the map to it
});

// info modal  
var infoBtn = L.easyButton('<img src="images/cities.png" width="20" height="20">', function() {
    const countryModal = new bootstrap.Modal($('#countryModal')[0]);
    countryModal.show();
});

// currency modal
var currencyBtn = L.easyButton('<img src="images/currency.png" width="20" height="20">', function() {
    const currencyCode = $('#curenCurrencyCodeConverter').text();  
    if (!currencyCode) {
        showAlert('Currency data is not available. Please try again later.', 'warning');
        return;
    }
    getCurrencyData(currencyCode);        

    const currencyModal = new bootstrap.Modal($('#currencyModal')[0]);
    currencyModal.show();
});

// weather modal
var weatherModalBtn = L.easyButton('<img src="images/weather.png" width="20" height="20">', function() {
    // We update the modal window with weather based on the active coordinates
    if (activeCoordinates.lat && activeCoordinates.lon) {
        getWeatherData(activeCoordinates.lat, activeCoordinates.lon, '');
    } else {
        showAlert('Sorry, the location is not defined.', 'danger');
    }

    const weatherModal = new bootstrap.Modal($('#weatherModal')[0]);
    weatherModal.show();
});

// wiki modal
var wikiBtn = L.easyButton('<img src="images/wiki.png" width="20" height="20">', function() {
    showWikiModal();
});

// icons
var capitalIcon = L.ExtraMarkers.icon({
    icon: 'fa-star',
    markerColor: 'red',
    shape: 'circle',
    prefix: 'fa'
});

var adminCityIcon = L.ExtraMarkers.icon({
    icon: 'fa-city',
    markerColor: 'blue',
    shape: 'circle',
    prefix: 'fa'
});

var simpleCityIcon = L.ExtraMarkers.icon({
    icon: 'fa-building',
    markerColor: 'green',
    shape: 'circle',
    prefix: 'fa'
});

// ---------------------------------------------------------
// EVENT HANDLERS
// ---------------------------------------------------------

// initialise and add controls once DOM is ready

$(document).ready(function () {
    $('#preloader').show();

    // download the list of countries
    loadCountryList();

    // Initialize the map
    map = L.map("map", {
        layers: [streets],  // default view with streets
        maxZoom: 18,
    }).fitWorld();

    // Add layer control section
    layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    // Add buttons to the map
    locationBtn.addTo(map);
    infoBtn.addTo(map);
    currencyBtn.addTo(map);
    weatherModalBtn.addTo(map);
    wikiBtn.addTo(map);    
    
    map.locate({
        setView: true,
        maxZoom: 6,
        watch: false, // avoid constantly updating the coordinates
        enableHighAccuracy: true
    });

    $(window).on('load', function() {
        // Hide preloader once the page is fully loaded
        $('#preloader').fadeOut('slow', function() {
            $(this).remove(); // remove preloader from DOM
        });
    });

    // Load country borders on location found
    map.on('locationfound', function (e) {
        handleUserLocation(e.latlng.lat, e.latlng.lng);
        activeCoordinates.lat = e.latlng.lat;
        activeCoordinates.lon = e.latlng.lng;
        $('#preloader').fadeOut('slow', function() {
            $(this).remove(); // remove preloader from DOM
        });
    });

    map.on('locationerror', function (e) {
        showAlert(e.message, 'warning');
        $('#preloader').fadeOut('slow', function() {
            $(this).remove(); // remove preloader from DOM
        });
    });

    $('#countrySelect').on('change', function() {
        const isoCode = $(this).val();
        getCountrySpecificBorders(isoCode)
            .then(() => {
                loadCitiesForCountry(isoCode);
            })
            .catch((error) => {
                showAlert('Error after fetching borders:', 'danger');
            });
        setCountryInform(isoCode);
    });

});

// ---------------------------------------------------------
// Functions
// ---------------------------------------------------------

// after finding the user, set all the necessary information by coordinates
function handleUserLocation(lat, lon) {
    $.ajax({
        url: 'php/countryName.php', // Using your PHP file for country name lookup
        method: 'GET',
        data: { lat: lat, lon: lon },
        dataType: 'json',
        success: function(data) {
            const isoCode = data.countryISO;
            $('#countrySelect').val(isoCode).change();
            $('#preloader').fadeOut('slow');
        },
        error: function() {
            showAlert('Error fetching location', 'danger');
            $('#preloader').fadeOut('slow');
        }
    });
}

// function to download the list of countries
function loadCountryList() {
    $.ajax({
        url: 'php/countryName.php', // Call your PHP file for the country list
        method: 'GET',
        dataType: 'json',
        success: function(countries) {
            const $countrySelect = $('#countrySelect');
            $countrySelect.empty();
            countries.forEach(country => {
                const option = $('<option></option>')
                    .val(country.iso)
                    .text(country.name);
                $countrySelect.append(option);
            });
        },
        error: function(xhr, status, error) {
            showAlert(
                'Sorry for the inconvenience, something went wrong with the server. Failed to load country list.',
                'warning'
            );
        }
    });
}

// add the borders of the selected country to the map
function getCountrySpecificBorders(isoCode) {
    return new Promise((resolve, reject) => {
        $.ajax({
                url: 'php/earthquakes.php', // Replace with your PHP file that gets country borders
                method: 'GET',
                data: { isoCode: isoCode },
                dataType: 'json',
                success: function(data) {
                    const specificCountryLayer = L.geoJSON(data, {
                        style: function () {
                            return {
                                color: '#0000FF',
                                weight: 3,
                                dashArray: '5, 5',
                                fillOpacity: 0
                            };
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
                error: function(error) {
                    reject(error);
                }
            });
    });
}

// Set information for country (ISO code, name, currency, etc.)
function setCountryInform(isoCode) {
    $.ajax({
        url: 'php/countryName.php', // Fetch country details from your PHP file
        method: 'GET',
        data: { isoCode: isoCode },
        dataType: 'json',
        success: function(data) {
            $('#countryName').text(data.name);
            $('#capital').text(data.capital);
            $('#population').text(numeral(data.population).format('0.0a'));
            $('#currency').text(`${data.currency.name} (${data.currency.symbol})`);
            $('#flag').html(`<img src="${data.flag}" width="100" alt="${data.flagAlt}">`);
            $('#region').text(data.region);
            $('#languages').text(data.languages);
            $('#timezones').text(data.timezones);
        },
        error: function(error) {
            showAlert('Error fetching country information', 'danger');
        }
    });
}

// Get weather information from PHP
function getWeatherData(lat, lon, locationName) {
    $.ajax({
        url: 'php/getWeather.php',
        method: 'GET',
        data: { lat: lat, lon: lon },
        dataType: 'json',
        success: function(data) {
            updateWeatherModal(data, locationName);
            getWeatherForecast(lat, lon);
        },
        error: function() {
            showAlert('Sorry, something went wrong with the weather service.', 'danger');
        }
    });
}

// Get weather forecast data from PHP
function getWeatherForecast(lat, lon) {
    $.ajax({
        url: 'php/getWeatherForecast.php',
        method: 'GET',
        data: { lat: lat, lon: lon },
        dataType: 'json',
        success: function(data) {
            updateWeatherForecast(data);
        },
        error: function() {
            showAlert('Sorry, something went wrong with the forecast service.', 'danger');
        }
    });
}

// Function for displaying weather data in modal
function updateWeatherModal(weatherData, locationName) {
    $('#weather-point-name').text(locationName.toUpperCase() || weatherData.name.toUpperCase());
    $('#current-date-time').text(moment().format('ddd Do'));
    $('#weather-icon').attr('src', `http://openweathermap.org/img/wn/${weatherData.icon}@2x.png`);
    $('#weather-description').text(weatherData.weatherDescription);
    $('#weather-temp').text(numeral(weatherData.temp).format('0')} °C);
    $('#humidity').text(numeral(weatherData.humidity).format('0')} %);
    $('#wind-speed').text(numeral(weatherData.windSpeed).format('0.0')} m/s);
    $('#pressure').text(numeral(weatherData.pressure).format('0')} hPa);
    $('#visibility').text(numeral(weatherData.visibility / 1000).format('0.0')} km);
}

// Function for receiving weather forecast data
function updateWeatherForecast(data) {
    // Forecast processing goes here
}

// Function to display Wikipedia info
function showWikiModal() {
    let countryName = $('#countrySelect option:selected').text().replace(/\s+/g, '_');
    
    $.ajax({
        url: 'php/wikipediaSearch.php',
        method: 'GET',
        data: { countryName: countryName },
        dataType: 'json',
        success: function(data) {
            $('#wiki-country-name').text(data.title);
            $('#wiki-intro').text(data.extract);
            $('#wiki-link').attr('href', data.content_urls);
            if (data.originalimage) {
                $('#wiki-image').attr('src', data.originalimage);
            } else {
                $('#wiki-image').hide();
            }
            const newsModal = new bootstrap.Modal($('#wikiModal')[0]);
            newsModal.show();
        },
        error: function(error) {
            showAlert('Error fetching Wikipedia data. Sorry for the inconvenience, data is available for this country.', 'danger');
        }
    });
}

// Function to notify the user
function showAlert(message, alertType = 'success', autoClose = true, closeDelay = 5000) {
    const $alertPlaceholder = $('#alertPlaceholder');
    const $alertHtml = $(`
        <div class="alert alert-${alertType} alert-dismissible fade show text-center" role="alert" style="z-index: 2000;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);
    $alertPlaceholder.html($alertHtml);
    
    if (autoClose) {
        setTimeout(() => {
            const $alertNode = $alertPlaceholder.find('.alert');
            if ($alertNode.length) {
                $alertNode.removeClass('show'); // hide messages
                $alertNode.on('transitionend', () => $alertNode.remove());
            }
        }, closeDelay);
    }
}
