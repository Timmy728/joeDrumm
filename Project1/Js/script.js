var map, layerControl;
var bordersLayerGroup = L.layerGroup();
var cityMarkersCluster = L.markerClusterGroup();
var adminCityClusterGroup = L.markerClusterGroup();
var placeMarker = null; // Marker to indicate selected places

// Tile layers (OpenStreetMap)
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
    "Administrative Cities": adminCityClusterGroup,
    "Cities": cityMarkersCluster,
};

// Initialize map
map = L.map("map", {
    layers: [streets],
    maxZoom: 18,
}).fitWorld();

// Add layer control section
layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

// Add geolocation functionality
map.locate({
    setView: true,
    maxZoom: 6,
    watch: false,
    enableHighAccuracy: true
});

// Handle when the location is found
map.on('locationfound', function (e) {
    handleUserLocation(e.latlng.lat, e.latlng.lng);
});

// Handle location errors
map.on('locationerror', function (e) {
    showAlert(e.message, 'warning');
});

// Load country borders based on selection
$('#countrySelect').on('change', function () {
    const isoCode = $(this).val();
    getCountrySpecificBorders(isoCode)
        .then(() => loadCitiesForCountry(isoCode))
        .catch((error) => {
            showAlert('Error fetching borders:', 'danger');
        });
    setCountryInform(isoCode);
});

// Functions for handling user location, fetching country borders, weather, and currency

function handleUserLocation(lat, lon) {
    $.ajax({
        url: 'Php/getWeather.php',
        method: 'GET',
        data: { lat: lat, lon: lon },
        dataType: 'json',
        success: function (data) {
            const isoCode = data.countryISO;
            $('#countrySelect').val(isoCode).change();
        },
        error: function () {
            showAlert('Error fetching location', 'danger');
        }
    });
}

// Fetch country borders
function getCountrySpecificBorders(isoCode) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: 'Data/countryBorders.geo.json',
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                const specificCountryLayer = L.geoJSON(data, {
                    filter: function (feature) {
                        return feature.properties.iso_a2 === isoCode;
                    },
                    style: {
                        color: '#0000FF',
                        weight: 2,
                        fillOpacity: 0.2,
                    }
                });

                if (bordersLayerGroup) {
                    bordersLayerGroup.clearLayers();
                }

                bordersLayerGroup.addLayer(specificCountryLayer);
                map.fitBounds(specificCountryLayer.getBounds());
                resolve();
            },
            error: function (error) {
                reject(error);
            }
        });
    });
}

// Set country information in the modal
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

// Helper function to show alerts
function showAlert(message, alertType = 'success') {
    const $alertPlaceholder = $('#alertPlaceholder');
    const $alertHtml = $(`<div class="alert alert-${alertType}">${message}</div>`);
    $alertPlaceholder.html($alertHtml);
    setTimeout(() => $alertPlaceholder.empty(), 3000);
}
