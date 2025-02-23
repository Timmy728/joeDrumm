// Preloader
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
    // Initialize the map
    map = L.map('map').setView([20, 0], 2);

    // Add tile layers
    let streets = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
    }).addTo(map);

    let satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    });

    let basemaps = {
        "Streets": streets,
        "Satellite": satellite
    };

    L.control.layers(basemaps).addTo(map);

    // Add EasyButtons for each PHP data point
    addEasyButton('fa-flag', 'countryInfoModal', 'Country Info');
    addEasyButton('fa-city', 'capitalCityModal', 'Capital City');
    addEasyButton('fa-users', 'populationModal', 'Population');
    addEasyButton('fa-money-bill', 'currencyModal', 'Currency');
    addEasyButton('fa-exchange-alt', 'exchangeRateModal', 'Exchange Rate');
    addEasyButton('fa-cloud-sun', 'weatherModal', 'Weather');
    addEasyButton('fa-clock', 'timezoneModal', 'Timezone');
    addEasyButton('fa-globe', 'wikipediaModal', 'Wikipedia');
    addEasyButton('fa-seismometer', 'earthquakeModal', 'Earthquakes');
    addEasyButton('fa-calendar-alt', 'weatherForecastModal', '10-Day Forecast');

    function addEasyButton(iconClass, modalId, tooltip) {
        L.easyButton(`fa ${iconClass} fa-lg`, function () {
            $(`#${modalId}`).modal('show');
        }, tooltip).addTo(map);
    }

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

    // On country selection
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

    // Data fetching functions for PHP files
    function displayCountryInfo(iso2) {
        $.get('Php/countryName.Php', { iso2: iso2 }, function (data) {
            $('#countryNames').text(data.name);
        }, 'json');
    }

    function displayPopulation(iso2) {
        $.get('Php/Population.Php', { countryCode: iso2 }, function (data) {
            $('#population').text(data.population);
        }, 'json');
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
        }, 'json');
    }

    function displayTimezone(iso2) {
        $.get('Php/Timezone.Php', { iso2: iso2 }, function (data) {
            $('#timezone').text(data.timezone);
        }, 'json');
    }

    function displayCurrency(iso2) {
        $.get('Php/Currency.Php', { iso2: iso2 }, function (data) {
            $('#currencyName').text(data.currency);
        }, 'json');
    }

    function displayExchangeRate(iso2) {
        $.get('Php/latestExchangeRate.php', { iso2: iso2 }, function (data) {
            $('#txtCurrencyRate').text(`1 USD = ${data.exchangeRate} ${data.currencyCode}`);
        }, 'json');
    }

    function displayWikipediaInfo(iso2) {
        $.get('Php/wikipediaSearch.Php', { query: iso2 }, function (data) {
            $('#wikiLink').attr('href', data.url).text(`View ${data.title} on Wikipedia`);
        }, 'json');
    }

    function displayEarthquakeData(iso2) {
        $.get('Php/earthQuakes.Php', { country: iso2 }, function (data) {
            $('#earthquakeList').html(data.earthquakes.map(quake => `<p>${quake.magnitude} at (${quake.lat}, ${quake.lon})</p>`).join(''));
        }, 'json');
    }

    function displayWeatherForecast(iso2) {
        $.get('Php/getWeatherForecast.Php', { location: iso2 }, function (data) {
            $('#forecastInfo').html(data.map(forecast => `<p>${forecast.date}: ${forecast.temp}</p>`).join(''));
        }, 'json');
    }
});
