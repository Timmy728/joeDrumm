$(window).on('load', function () {
    if ($('#preloader').length) {
        $('#preloader').delay(1000).fadeOut('slow', function () {
            $(this).remove();
        });
    }
});

let map;
let bordersLayer;
let selectedCountryISO2;
let countryBordersData;

var streets = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
});

var satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
});

var basemaps = {
    "Streets": streets,
    "Satellite": satellite
};

var infoBtn = L.easyButton('fa-info fa-xl', function (btn, map) {
    $('#countryInfoModal').modal('show');
});

$(document).ready(function () {
    map = L.map('map', {
        layers: [streets]
    }).setView([54.5, -4], 6);

    layerControl = L.control.layers(basemaps).addTo(map);
    infoBtn.addTo(map);

    $.ajax({
        url: 'Php/countryName.Php',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            const dropdown = $('#countrySelect');
            dropdown.empty();
            dropdown.append(new Option('Select a Country', ''));
            data.forEach(function (country) {
                if (country.name && country.iso2) {
                    dropdown.append(new Option(country.name, country.iso2));
                }
            });
        },
        error: function (xhr, status, error) {
            console.error('Error fetching country list:', error);
        }
    });

    $('#countrySelect').change(function () {
        const iso2 = $(this).val();
        if (iso2) {
            fetchAllCountryData(iso2);
        }
    });

    function fetchAllCountryData(iso2) {
        displayCountryInfo(iso2);
        displayPopulation(iso2);
        fetchCoordinatesAndDisplayWeather(iso2);
        displayTimezone(iso2);
        displayCurrency(iso2);
        displayExchangeRate(iso2);
        displayWikipediaInfo(iso2);
        displayEarthquakeData(iso2);
        displayWeatherForecast(iso2);
        updateCountryBorders(iso2);
    }

    function updateCountryBorders(iso2) {
        if (bordersLayer) {
            map.removeLayer(bordersLayer);
        }
        $.getJSON('Data/countryBorders.geo.json', function (data) {
            const country = data.features.find(
                feature => feature.properties.iso_a2 === iso2
            );
            if (country) {
                bordersLayer = L.geoJSON(country, {
                    style: {
                        color: 'blue',
                        weight: 2,
                        fillColor: 'orange',
                        fillOpacity: 0.3
                    }
                }).addTo(map);
                map.fitBounds(bordersLayer.getBounds());
            }
        });
    }

    function fetchCoordinatesAndDisplayWeather(iso2) {
        $.get('https://restcountries.com/v3.1/alpha/' + iso2, function (data) {
            if (data && data[0] && data[0].latlng) {
                const [lat, lon] = data[0].latlng;
                displayWeather(lat, lon);
            }
        }, 'json');
    }

    function displayWeather(lat, lon) {
        $.get('Php/getWeather.Php', { lat: lat, lon: lon }, function (data) {
            $('#tempToday').text(data.temperature);
            $('#conditionsToday').text(data.description);
            $('#weatherImg').html(`<img src="${data.icon}" alt="Weather Icon">`);
        }, 'json');
    }
});
