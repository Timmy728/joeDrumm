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
    // Initialize the map with Esri tile layers
    map = L.map('map', {
        layers: [
            L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
                attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
            })
        ]
    }).setView([20, 0], 2); // Initial global view

    let satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    });

    let basemaps = {
        "Streets": map._layers[Object.keys(map._layers)[0]],
        "Satellite": satellite
    };

    L.control.layers(basemaps).addTo(map);

    // Load and display country borders on map load
    fetchCountryBorders();

    function fetchCountryBorders() {
        $.getJSON('Data/countryBorders.geo.json', function (data) {
            countryBordersData = data;

            bordersLayer = L.geoJSON(countryBordersData, {
                style: {
                    color: 'gray',
                    weight: 1,
                    fillColor: 'lightgray',
                    fillOpacity: 0.2
                }
            }).addTo(map);
        }).fail(function () {
            console.error('Failed to load country borders');
        });
    }

    // Highlight selected country when picked
    function updateCountryBorders(iso2) {
        if (bordersLayer) {
            map.removeLayer(bordersLayer);
        }

        const country = countryBordersData.features.find(
            feature => feature.properties.iso_a2 === iso2
        );


    // Add EasyButton for displaying country info
    L.easyButton('fa-info', function () {
        $('#countryInfoModal').modal('show');
    }).addTo(map);

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

    function fetchCoordinatesAndDisplayWeather(iso2) {
        $.get('https://restcountries.com/v3.1/alpha/' + iso2, function (data) {
            if (data && data[0] && data[0].latlng) {
                const [lat, lon] = data[0].latlng;
                displayWeather(lat, lon);
            }
        }, 'json');
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

    function displayCountryInfo(iso2) {
        $.get('Php/countryName.Php', { iso2: iso2 }, function (data) {
            $('#countryNames').text(data.name);
            $('#capitalCity').text(data.capital);
            $('#population').text(data.population);
        }, 'json');
    }

    function displayPopulation(iso2) {
        $.get('Php/Population.Php', { countryCode: iso2 }, function (data) {
            $('#population').text(data.population);
        }, 'json');
    }

    function displayWeather(lat, lon) {
        $.get('Php/getWeather.Php', { lat: lat, lon: lon }, function (data) {
            $('#tempToday').text(data.temperature);
            $('#conditionsToday').text(data.description);
            $('#weatherImg').html(`<img src="${data.icon}" alt="Weather Icon">`);
        }, 'json');
    }

    function displayTimezone(iso2) {
        $.get('Php/Timezone.Php', { iso2: iso2 }, function (data) {
            $('#timezone').text(data.timezone);
        }, 'json');
    }

    function displayCurrency(iso2) {
        $.get('Php/Currency.Php', { iso2: iso2 }, function (data) {
            if (data && data.currencies && data.currencies.length > 0) {
                let currency = data.currencies[0];
                $('#currencyName').text(`${currency.name} (${currency.code}) - ${currency.symbol}`);
            } else {
                $('#currencyName').text('Currency not available');
            }
        }, 'json');
    }

    function displayExchangeRate(iso2) {
        $.get('Php/latestExchangeRate.php', { iso2: iso2 }, function (data) {
            $('#txtCurrencyRate').text(`1 USD = ${data.exchangeRate} ${data.currencyCode}`);
        }, 'json');
    }

    function displayWikipediaInfo(iso2) {
        $.get('https://restcountries.com/v3.1/alpha/' + iso2, function (data) {
            if (data && data[0]) {
                const countryName = data[0].name.common;
                $.get('Php/wikipediaSearch.Php', { query: countryName }, function (wikiData) {
                    $('#wikiLink').attr('href', wikiData.url).text(`View ${wikiData.title} on Wikipedia`);
                }, 'json');
            }
        }, 'json');
    }

    function displayEarthquakeData(iso2) {
        $.get('Php/earthQuakes.Php', { country: iso2 }, function (data) {
            let earthquakeHtml = '';
            data.earthquakes.forEach(quake => {
                earthquakeHtml += `<p>📍 Magnitude: ${quake.magnitude} | Depth: ${quake.depth}km | Location: (${quake.lat}, ${quake.lng}) | Time: ${quake.datetime}</p>`;
            });
            $('#earthquakeList').html(earthquakeHtml);
        }, 'json');
    }

    function displayWeatherForecast(iso2) {
        $.get('Php/getWeatherForecast.Php', { location: iso2 }, function (data) {
            let forecastHtml = '<h4>10-Day Weather Forecast:</h4>';
            data.forEach(forecast => {
                let minTemp = forecast.min_temp !== null ? forecast.min_temp + '°C' : 'No Data';
                let maxTemp = forecast.max_temp !== null ? forecast.max_temp + '°C' : 'No Data';
                forecastHtml += `<p>${forecast.date}: ${minTemp} - ${maxTemp}</p>`;
            });
            $('#forecastInfo').html(forecastHtml);
        }, 'json');
    }
});
