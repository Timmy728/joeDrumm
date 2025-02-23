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

$(document).ready(function () {
    map = L.map('map').setView([20, 0], 2);

    let streets = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri"
    });
    
    let satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri"
    });

    let basemaps = {
        "Streets": streets,
        "Satellite": satellite
    };

    streets.addTo(map);
    L.control.layers(basemaps).addTo(map);

    // Populate countries dropdown
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
        displayCountryName(iso2);
        displayCapitalCity(iso2);
        displayPopulation(iso2);
        displayCurrency(iso2);
        displayExchangeRate(iso2);
        displayWeather(iso2);
        displayWeatherForecast(iso2);
        displayWikipediaInfo(iso2);
        displayTimezone(iso2);
        displayEarthquakeData(iso2);
        updateCountryBorders(iso2);
    }

    function displayCountryName(iso2) {
        $.get('Php/countryName.Php', { iso2: iso2 }, function (data) {
            $('#countryNames').text(data.name);
        }, 'json');
    }

    function displayCapitalCity(iso2) {
        $.get('Php/capitalCities.Php', { iso2: iso2 }, function (data) {
            $('#capitalCity').text(data.capital);
        }, 'json');
    }

    function displayPopulation(iso2) {
        $.get('Php/Population.Php', { countryCode: iso2 }, function (data) {
            console.log('Population data:', data);
            $('#population').text(data.population || 'Data not available');
        }, 'json');
    }

    function displayCurrency(iso2) {
        $.get('Php/Currency.Php', { iso2: iso2 }, function (data) {
            console.log('Currency data:', data);
            $('#currencyName').text(data.name || 'N/A');
            $('#currencySymbol').text(data.symbol || 'N/A');
        }, 'json');
    }

    function displayExchangeRate(iso2) {
        $.get('Php/latestExchangeRate.php', { iso2: iso2 }, function (data) {
            console.log('Exchange rate:', data);
            $('#txtCurrencyRate').text(`1 USD = ${data.exchangeRate} ${data.currencyCode}`);
        }, 'json');
    }

    function displayWeather(iso2) {
        $.get('Php/getWeather.Php', { iso2: iso2 }, function (data) {
            console.log('Weather data:', data);
            $('#tempToday').text(data.temperature || 'N/A');
            $('#conditionsToday').text(data.description || 'N/A');
            $('#weatherImg').html(`<img src="${data.icon}" alt="Weather Icon">`);
        }, 'json');
    }

    function displayWeatherForecast(iso2) {
        $.get('Php/getWeatherForecast.Php', { location: iso2 }, function (data) {
            console.log('Forecast data:', data);
            let forecastHtml = '';
            data.forEach(forecast => {
                forecastHtml += `<p>${forecast.date}: ${forecast.min_temp}°C - ${forecast.max_temp}°C</p>`;
            });
            $('#forecastInfo').html(forecastHtml);
        }, 'json');
    }

    function displayWikipediaInfo(iso2) {
        $.get('Php/wikipediaSearch.Php', { query: iso2 }, function (data) {
            console.log('Wikipedia data:', data);
            $('#wikiLink').attr('href', data.url).text(`View ${data.title} on Wikipedia`);
        }, 'json');
    }

    function displayTimezone(iso2) {
        $.get('Php/Timezone.Php', { iso2: iso2 }, function (data) {
            console.log('Timezone data:', data);
            $('#timezone').text(data.timezone);
        }, 'json');
    }

    function displayEarthquakeData(iso2) {
        $.get('Php/earthQuakes.Php', { country: iso2 }, function (data) {
            console.log('Earthquake data:', data);
            let earthquakeHtml = '';
            data.earthquakes.forEach(quake => {
                earthquakeHtml += `<p>📍 Magnitude: ${quake.magnitude} | Depth: ${quake.depth}km | Location: (${quake.lat}, ${quake.lng}) | Time: ${quake.datetime}</p>`;
            });
            $('#earthquakeList').html(earthquakeHtml);
        }, 'json');
    }

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
});
