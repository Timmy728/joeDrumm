// ---------------------------------------------------------
// GLOBAL DECLARATIONS
// ---------------------------------------------------------

var map, layerControl;
var bordersLayerGroup = L.layerGroup();
var airportClusterGroup = L.markerClusterGroup({
    maxClusterRadius: 50,
    polygonOptions: {
        fillColor: "#FFFF00",
        color: "#000",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.5
    }
});
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

// Tile layers
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

var overlayMaps = {
    "Airports": airportClusterGroup,
    "Administrative Cities": adminCityClusterGroup,
    "Cities": cityMarkersCluster,
};

var countryBorderLayerRef = { specificCountry: null}; 
var activeCoordinates = { lat: null, lon: null };

// ---------------------------------------------------------
// BUTTONS
// ---------------------------------------------------------

// Location Button (Find user's location) with custom icon
var locationBtn = L.easyButton('<img src="images/button/home.png" width="20" height="20">', function(btn, map) {
    map.locate({setView: false}); 
});

// Country Info Button (Show Country Info Modal) with custom icon
var infoBtn = L.easyButton('<img src="images/button/info.png" width="20" height="20">', function() {
    const countryModal = new bootstrap.Modal($('#countryModal')[0]);
    countryModal.show();
});

// Currency Button (Show Currency Calculator Modal) with custom icon
var currencyBtn = L.easyButton('<img src="images/button/exchange.png" width="20" height="20">', function() {
    const currencyCode = $('#curenCurrencyCodeConverter').text();  
    if (!currencyCode) {
        showAlert('Currency data is not available. Please try again later.', 'warning');
        return;
    }
    getCurrencyData(currencyCode);        
    const currencyModal = new bootstrap.Modal($('#currencyModal')[0]);
    currencyModal.show();
});

// Weather Button (Show Weather Modal) with custom icon
var weatherModalBtn = L.easyButton('<img src="images/button/weather.png" width="20" height="20">', function() {
    // We update the modal window with weather based on the active coordinates
    if (activeCoordinates.lat && activeCoordinates.lon) {
        getWeatherData(activeCoordinates.lat, activeCoordinates.lon, '');
    } else {
        showAlert('Sorry, the location is not defined.', 'danger');
    }
    const weatherModal = new bootstrap.Modal($('#weatherModal')[0]);
    weatherModal.show();
});

// Wikipedia Button (Show Wikipedia Modal) with custom icon
var wikiBtn = L.easyButton('<img src="images/button/wikipedia.png" width="20" height="20">', function() {
    showWikiModal();
});

// ---------------------------------------------------------
// EVENT HANDLERS
// ---------------------------------------------------------

// Initialize map after the DOM is ready
$(document).ready(function () {
    $('#preloader').show();

    // Initialize the map
    map = L.map("map", {
        layers: [streets],  // Default view with streets
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
        watch: false,
        enableHighAccuracy: true
    });

    $(window).on('load', function() {
        // Hide preloader once the page is fully loaded
        $('#preloader').fadeOut('slow', function() {
            $(this).remove();
        });
    });

    // Load country borders and airports on location found
    map.on('locationfound', function (e) {
        handleUserLocation(e.latlng.lat, e.latlng.lng);
        activeCoordinates.lat = e.latlng.lat;
        activeCoordinates.lon = e.latlng.lng;
        $('#preloader').fadeOut('slow', function() {
            $(this).remove();
        });
    });

    map.on('locationerror', function (e) {
        showAlert(e.message, 'warning');
        $('#preloader').fadeOut('slow', function() {
            $(this).remove();
        });
    });

    $('#countrySelect').on('change', function() {
        const isoCode = $(this).val();
        getCountrySpecificBorders(isoCode)
            .then(() => {
                loadAirportsForCountry(isoCode);
                loadCitiesForCountry(isoCode);
            })
            .catch((error) => {
                showAlert('Error fetching borders:', 'danger');
            });
        setCountryInform(isoCode);
    });
});

// ---------------------------------------------------------
// Functions
// ---------------------------------------------------------

// Handle user location after detecting coordinates
function handleUserLocation(lat, lon) {
    $.ajax({
        url: 'php/getWeather.php', // Detect location and fetch weather
        method: 'GET',
        data: { lat: lat, lon: lon },
        dataType: 'json',
        success: function(data) {
            const isoCode = data.countryISO; // Assuming weather API returns countryISO
            $('#countrySelect').val(isoCode).change();
            $('#preloader').fadeOut('slow');
        },
        error: function() {
            showAlert('Error fetching location', 'danger');
            $('#preloader').fadeOut('slow');
        }
    });
}

// Function to load the list of countries
function loadCountryList() {
    $.ajax({
        url: 'php/countryName.php',
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
        error: function() {
            showAlert('Error fetching countries', 'danger');
        }
    });
}

// Function to add borders for a selected country
function getCountrySpecificBorders(isoCode) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: 'php/getWeatherForecast.php', // Use for borders via coordinates
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
