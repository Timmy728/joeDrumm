$(window).on('load', function () {
    if ($('#preloader').length) {
        $('#preloader').delay(1000).fadeOut('slow', function () {
            $(this).remove();
        });
    }
});

let map;
let bordersLayer;

$(document).ready(function () {
    map = L.map('map').setView([20, 0], 2);

    var streets = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri"
    });

    var satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri"
    });

    var basemaps = {
        "Streets": streets,
        "Satellite": satellite
    };

    L.control.layers(basemaps).addTo(map);
    streets.addTo(map);

    // Add 5 EasyButtons
    L.easyButton('fa-flag', function () {
        $('#infoModal1').modal('show');
    }).addTo(map);

    L.easyButton('fa-users', function () {
        $('#infoModal2').modal('show');
    }).addTo(map);

    L.easyButton('fa-exchange-alt', function () {
        $('#infoModal3').modal('show');
    }).addTo(map);

    L.easyButton('fa-cloud-sun', function () {
        $('#infoModal4').modal('show');
    }).addTo(map);

    L.easyButton('fa-globe', function () {
        $('#infoModal5').modal('show');
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

    // Display currency and converter
    function displayCurrency(iso2) {
        $.get('Php/Currency.Php', { iso2: iso2 }, function (data) {
            $('#currencyName').text(data.name);
            $('#currencySymbol').text(data.symbol);
        }, 'json');
    }

    function displayExchangeRate(iso2) {
        $.get('Php/latestExchangeRate.php', { iso2: iso2 }, function (data) {
            $('#txtCurrencyRate').text(`1 USD = ${data.exchangeRate} ${data.currencyCode}`);

            // Currency converter functionality
            $('#convertBtn').off('click').on('click', function () {
                const amount = parseFloat($('#currencyAmount').val());
                if (!isNaN(amount)) {
                    const convertedAmount = (amount * data.exchangeRate).toFixed(2);
                    $('#convertedCurrency').text(`${amount} USD = ${convertedAmount} ${data.currencyCode}`);
                } else {
                    $('#convertedCurrency').text('Please enter a valid number');
                }
            });
        }, 'json');
    }

    // Display country info with flag
    function displayCountryInfo(iso2) {
        $.get('https://restcountries.com/v3.1/alpha/' + iso2, function (data) {
            if (data && data[0]) {
                const countryName = data[0].name.common;
                const flagUrl = data[0].flags.svg;
                $('#countryNames').html(`<img src="${flagUrl}" alt="${countryName} Flag" width="30"> ${countryName}`);
            }
        }, 'json');
    }

    // Fetch and display weather
    function displayWeather(iso2) {
        $.get('Php/getWeather.Php', { iso2: iso2 }, function (data) {
            $('#tempToday').text(data.temperature);
            $('#conditionsToday').text(data.description);
        }, 'json');
    }

    // Other data fetching functions can be added similarly...
});
