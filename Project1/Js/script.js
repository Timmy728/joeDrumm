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

    // Add tile layer
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

    // On country selection
    $('#countrySelect').change(function () {
        const iso2 = $(this).val();
        if (iso2) {
            selectedCountryISO2 = iso2;
            fetchCountryData(iso2);
        }
    });

    function fetchCountryData(iso2) {
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

    // Setup easy buttons for each PHP file
    const phpFiles = [
        'countryName.Php',
        'capitalCities.Php',
        'Population.Php',
        'Currency.Php',
        'latestExchangeRate.php',
        'getWeather.Php',
        'getWeatherForecast.Php',
        'Timezone.Php',
        'wikipediaSearch.Php',
        'earthQuakes.Php'
    ];

    phpFiles.forEach((file, index) => {
        L.easyButton(`fa-${index + 1}`, function () {
            if (selectedCountryISO2) {
                fetchDataFromPHP(file, selectedCountryISO2, index + 1);
            } else {
                alert('Please select a country first.');
            }
        }).addTo(map);
    });

    function fetchDataFromPHP(file, iso2, buttonNumber) {
        $.ajax({
            url: `Php/${file}`,
            method: 'GET',
            data: { iso2: iso2 },
            dataType: 'json',
            success: function (data) {
                displayDataInModal(buttonNumber, data);
            },
            error: function (xhr, status, error) {
                console.error(`Error fetching data from ${file}:`, error);
            }
        });
    }

    function displayDataInModal(buttonNumber, data) {
        let modalBody = '';
        switch (buttonNumber) {
            case 1:
                modalBody = `<p><strong>Country:</strong> ${data.name}</p>`;
                break;
            case 2:
                modalBody = `<p><strong>Capital City:</strong> ${data.capital}</p>`;
                break;
            case 3:
                modalBody = `<p><strong>Population:</strong> ${data.population}</p>`;
                break;
            case 4:
                modalBody = `<p><strong>Currency:</strong> ${data.currency}</p>`;
                break;
            case 5:
                modalBody = `<p><strong>Exchange Rate:</strong> 1 USD = ${data.exchangeRate} ${data.currencyCode}</p>`;
                break;
            case 6:
                modalBody = `<p><strong>Temperature:</strong> ${data.temperature}°C</p><p><strong>Conditions:</strong> ${data.description}</p>`;
                break;
            case 7:
                modalBody = `<p><strong>10-Day Weather Forecast:</strong> ${data.forecast}</p>`;
                break;
            case 8:
                modalBody = `<p><strong>Timezone:</strong> ${data.timezone}</p>`;
                break;
            case 9:
                modalBody = `<p><strong>Wikipedia:</strong> <a href='${data.url}' target='_blank'>View on Wikipedia</a></p>`;
                break;
            case 10:
                modalBody = `<p><strong>Recent Earthquakes:</strong> ${data.earthquakes}</p>`;
                break;
        }
        $('#countryInfoModal .modal-body').html(modalBody);
        $('#countryInfoModal').modal('show');
    }
});
