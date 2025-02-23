// Initialize global variables
let map;
let bordersLayer;
let selectedCountryISO2;
let countryBordersData;

// Initialize the map on document ready
$(document).ready(function () {
    map = L.map('map', {
        layers: [streets]
    }).setView([54.5, -4], 6);

    // Add map layers for streets and satellite view
    const streets = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri"
    }).addTo(map);

    const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri"
    });

    const basemaps = {
        "Streets": streets,
        "Satellite": satellite
    };

    L.control.layers(basemaps).addTo(map);

    // Add EasyButtons for each modal
    createEasyButtons();

    // Populate dropdown on page load
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

    // Handle country selection from dropdown
    $('#countrySelect').change(function () {
        selectedCountryISO2 = $(this).val();
        if (selectedCountryISO2) {
            updateCountryBorders(selectedCountryISO2);
        }
    });
});

// Function to update borders when country is selected
function updateCountryBorders(iso2) {
    if (bordersLayer) {
        map.removeLayer(bordersLayer);
    }
    $.getJSON('Data/countryBorders.geo.json', function (data) {
        const country = data.features.find(feature => feature.properties.iso_a2 === iso2);
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

// Function to create EasyButtons for each data type
function createEasyButtons() {
    const buttonActions = [
        { icon: 'fa-flag', modal: 'countryNameModal', fetch: fetchCountryName },
        { icon: 'fa-landmark', modal: 'capitalCityModal', fetch: fetchCapitalCity },
        { icon: 'fa-users', modal: 'populationModal', fetch: fetchPopulation },
        { icon: 'fa-money-bill', modal: 'currencyModal', fetch: fetchCurrency },
        { icon: 'fa-exchange-alt', modal: 'exchangeRateModal', fetch: fetchExchangeRate },
        { icon: 'fa-cloud-sun', modal: 'weatherModal', fetch: fetchWeather },
        { icon: 'fa-calendar-day', modal: 'forecastModal', fetch: fetchWeatherForecast },
        { icon: 'fa-wikipedia-w', modal: 'wikipediaModal', fetch: fetchWikipediaInfo },
        { icon: 'fa-clock', modal: 'timezoneModal', fetch: fetchTimezone },
        { icon: 'fa-earthquake', modal: 'earthquakeModal', fetch: fetchEarthquakeData }
    ];

    buttonActions.forEach((action, index) => {
        L.easyButton(action.icon, function () {
            if (selectedCountryISO2) {
                action.fetch(selectedCountryISO2);
                $('#' + action.modal).modal('show');
            } else {
                alert('Please select a country first.');
            }
        }).addTo(map);
    });
}

// Data fetching functions for each button
function fetchCountryName(iso2) {
    $.get('Php/countryName.Php', { iso2: iso2 }, function (data) {
        $('#countryNameContent').text(data.name);
    }, 'json');
}

function fetchCapitalCity(iso2) {
    $.get('Php/capitalCities.Php', { iso2: iso2 }, function (data) {
        $('#capitalCityContent').text(data.capital);
    }, 'json');
}

function fetchPopulation(iso2) {
    $.get('Php/Population.Php', { countryCode: iso2 }, function (data) {
        $('#populationContent').text(data.population);
    }, 'json');
}

function fetchCurrency(iso2) {
    $.get('Php/Currency.Php', { iso2: iso2 }, function (data) {
        $('#currencyContent').text(`${data.currencies[0].name} (${data.currencies[0].code}) - ${data.currencies[0].symbol}`);
    }, 'json');
}

function fetchExchangeRate(iso2) {
    $.get('Php/latestExchangeRate.php', { iso2: iso2 }, function (data) {
        $('#exchangeRateContent').text(`1 USD = ${data.exchangeRate} ${data.currencyCode}`);
    }, 'json');
}

function fetchWeather(iso2) {
    $.get('Php/getWeather.Php', { iso2: iso2 }, function (data) {
        $('#weatherContent').text(`${data.temperature}°C, ${data.description}`);
    }, 'json');
}

function fetchWeatherForecast(iso2) {
    $.get('Php/getWeatherForecast.Php', { location: iso2 }, function (data) {
        let forecastHtml = '';
        data.forEach(day => {
            forecastHtml += `<p>${day.date}: ${day.min_temp}°C - ${day.max_temp}°C</p>`;
        });
        $('#forecastContent').html(forecastHtml);
    }, 'json');
}

function fetchWikipediaInfo(iso2) {
    $.get('Php/wikipediaSearch.Php', { query: iso2 }, function (data) {
        $('#wikipediaContent').html(`<a href='${data.url}' target='_blank'>View ${data.title} on Wikipedia</a>`);
    }, 'json');
}

function fetchTimezone(iso2) {
    $.get('Php/Timezone.Php', { iso2: iso2 }, function (data) {
        $('#timezoneContent').text(data.timezone);
    }, 'json');
}

function fetchEarthquakeData(iso2) {
    $.get('Php/earthQuakes.Php', { country: iso2 }, function (data) {
        let earthquakeHtml = '';
        data.earthquakes.forEach(quake => {
            earthquakeHtml += `<p>Magnitude: ${quake.magnitude} | Depth: ${quake.depth} km | Location: (${quake.lat}, ${quake.lng}) | Time: ${quake.datetime}</p>`;
        });
        $('#earthquakeContent').html(earthquakeHtml);
    }, 'json');
}
