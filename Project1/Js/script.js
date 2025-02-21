// Initialize map and variables
let map;
let bordersLayer;
let selectedCountryISO2;

$(document).ready(function () {
    // Initialize the map
    map = L.map('map').setView([20, 0], 2);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add EasyButton
    L.easyButton('fa-info', function () {
        $('#countryInfoModal').modal('show');
    }).addTo(map);

    // Populate countries dropdown from restcountries.org
    $.ajax({
        url: 'https://restcountries.com/v3.1/all',
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            const dropdown = $('#countrySelect');
            dropdown.empty();
            dropdown.append(new Option('Select a Country', ''));
            data.sort((a, b) => a.name.common.localeCompare(b.name.common));
            data.forEach(function (country) {
                if (country.cca2 && country.name.common) {
                    dropdown.append(new Option(country.name.common, country.cca2));
                }
            });
        },
        error: function (xhr, status, error) {
            console.error('Error fetching countries:', error);
        }
    });

    // Handle country selection
    $('#countrySelect').change(function () {
        const iso2 = $(this).val();
        if (iso2) {
            updateCountryData(iso2);
        }
    });

    // Update country data
    function updateCountryData(iso2) {
        fetchCountryDetails(iso2);
        zoomToCountry(iso2);
        displayEarthquakeData(iso2);
        displayWeatherForecast(iso2);
    }

    // Fetch and display country information
    function fetchCountryDetails(iso2) {
        $.get('Php/countryName.Php', { iso2: iso2 }, function (data) {
            $('#countryName').text(data.name);
            $('#capitalCity').text(data.capital);
            $('#population').text(data.population);
            $('#currencyName').text(`${data.currency} (${data.currencyCode}) - ${data.currencySymbol}`);
        }, 'json');

        $.get('Php/Timezone.Php', { iso2: iso2 }, function (data) {
            $('#timezone').text(data.timezone);
        }, 'json');

        $.get('Php/latestExchangeRate.php', { iso2: iso2 }, function (data) {
            $('#exchangeRate').text(`1 USD = ${data.exchangeRate} ${data.currencyCode}`);
        }, 'json');

        $.get('Php/wikipediaSearch.Php', { query: iso2 }, function (data) {
            $('#wikiLink').attr('href', data.url).text(`View ${data.title} on Wikipedia`);
        }, 'json');
    }

    // Zoom into the selected country
    function zoomToCountry(iso2) {
        $.getJSON('Data/countryBorders.geo.json', function (data) {
            const country = data.features.find(
                feature => feature.properties.iso_a2 === iso2
            );
            if (country) {
                if (bordersLayer) {
                    map.removeLayer(bordersLayer);
                }
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

    // Display recent earthquakes
    function displayEarthquakeData(iso2) {
        $.get('Php/earthQuakes.Php', { country: iso2 }, function (data) {
            let earthquakeHtml = '';
            data.earthquakes.forEach(quake => {
                earthquakeHtml += `<p>📍 Magnitude: ${quake.magnitude} | Depth: ${quake.depth}km | Location: (${quake.lat}, ${quake.lng}) | Time: ${quake.datetime}</p>`;
            });
            $('#earthquakeList').html(earthquakeHtml);
        }, 'json');
    }

    // Display 10-day weather forecast
    function displayWeatherForecast(iso2) {
        $.get('Php/getWeatherForecast.Php', { iso2: iso2 }, function (data) {
            let forecastHtml = '';
            data.forEach(forecast => {
                forecastHtml += `<p>${forecast.date}: ${forecast.min_temp}°C - ${forecast.max_temp}°C</p>`;
            });
            $('#forecastInfo').html(forecastHtml);
        }, 'json');
    }
});
