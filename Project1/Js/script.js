// Initialize Map
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
    // Map Tile Layers
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

    map = L.map('map', {
        layers: [streets]
    }).setView([20, 0], 2);

    L.control.layers(basemaps).addTo(map);

    // Populate Country Dropdown
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

    $('#countrySelect').change(function () {
        selectedCountryISO2 = $(this).val();
        if (selectedCountryISO2) {
            fetchAllCountryData(selectedCountryISO2);
        }
    });

    // Function to fetch all country data when a country is selected
    function fetchAllCountryData(iso2) {
        updateCountryBorders(iso2);
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

    // Easy Buttons for Each PHP File
    const phpEndpoints = [
        { endpoint: 'countryName.Php', modal: '#countryInfoModal' },
        { endpoint: 'capitalCities.Php', modal: '#capitalCityModal' },
        { endpoint: 'Population.Php', modal: '#populationModal' },
        { endpoint: 'Currency.Php', modal: '#currencyModal' },
        { endpoint: 'latestExchangeRate.php', modal: '#exchangeRateModal' },
        { endpoint: 'getWeather.Php', modal: '#weatherModal' },
        { endpoint: 'getWeatherForecast.Php', modal: '#forecastModal' },
        { endpoint: 'Timezone.Php', modal: '#timezoneModal' },
        { endpoint: 'wikipediaSearch.Php', modal: '#wikipediaModal' },
        { endpoint: 'earthQuakes.Php', modal: '#earthquakeModal' }
    ];

    phpEndpoints.forEach((php, index) => {
        L.easyButton(`fa-info fa-${index + 1}`, function () {
            if (selectedCountryISO2) {
                $.get(`Php/${php.endpoint}`, { iso2: selectedCountryISO2 }, function (data) {
                    displayModalData(php.modal, data);
                    $(php.modal).modal('show');
                }, 'json');
            } else {
                alert('Please select a country first.');
            }
        }).addTo(map);
    });

    // Function to display modal data dynamically
    function displayModalData(modalId, data) {
        $(modalId).find('.modal-body').html('');
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                $(modalId).find('.modal-body').append(`<p><strong>${key}:</strong> ${data[key]}</p>`);
            }
        }
    }
});
