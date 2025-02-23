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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add EasyButtons for each PHP file
    const buttonsData = [
        { icon: 'fa-flag', modalId: '#countryNameModal', phpFile: 'countryName.Php', dataKey: 'name', label: 'Country Name' },
        { icon: 'fa-city', modalId: '#capitalCityModal', phpFile: 'capitalCities.Php', dataKey: 'capital', label: 'Capital City' },
        { icon: 'fa-users', modalId: '#populationModal', phpFile: 'Population.Php', dataKey: 'population', label: 'Population' },
        { icon: 'fa-money-bill', modalId: '#currencyModal', phpFile: 'Currency.Php', dataKey: 'currencies', label: 'Currency' },
        { icon: 'fa-dollar-sign', modalId: '#exchangeRateModal', phpFile: 'latestExchangeRate.Php', dataKey: 'exchangeRate', label: 'Exchange Rate' },
        { icon: 'fa-cloud-sun', modalId: '#weatherModal', phpFile: 'getWeather.Php', dataKey: 'description', label: 'Current Weather' },
        { icon: 'fa-temperature-high', modalId: '#weatherForecastModal', phpFile: 'getWeatherForecast.Php', dataKey: 'forecast', label: '10-Day Forecast' },
        { icon: 'fa-globe', modalId: '#timezoneModal', phpFile: 'Timezone.Php', dataKey: 'timezone', label: 'Timezone' },
        { icon: 'fa-earthquake', modalId: '#earthquakeModal', phpFile: 'earthQuakes.Php', dataKey: 'earthquakes', label: 'Recent Earthquakes' },
        { icon: 'fa-book', modalId: '#wikipediaModal', phpFile: 'wikipediaSearch.Php', dataKey: 'title', label: 'Wikipedia Info' }
    ];

    buttonsData.forEach((button, index) => {
        L.easyButton(button.icon, function () {
            if (!selectedCountryISO2) {
                alert('Please select a country first.');
                return;
            }
            fetchDataAndShowModal(button);
        }).addTo(map);
    });

    function fetchDataAndShowModal(button) {
        $.ajax({
            url: 'Php/' + button.phpFile,
            method: 'GET',
            data: { iso2: selectedCountryISO2 },
            dataType: 'json',
            success: function (data) {
                console.log(`Response from ${button.phpFile}:`, data);
                let content = '';
                if (data[button.dataKey]) {
                    content = data[button.dataKey];
                } else if (Array.isArray(data[button.dataKey])) {
                    content = data[button.dataKey].map(item => JSON.stringify(item)).join('<br>');
                } else {
                    content = 'Data not available.';
                }
                $(`${button.modalId} .modal-body`).html(`<p><strong>${button.label}:</strong> ${content}</p>`);
                $(button.modalId).modal('show');
            },
            error: function (xhr, status, error) {
                console.error(`Error fetching data from ${button.phpFile}:`, error);
            }
        });
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
        selectedCountryISO2 = $(this).val();
        if (selectedCountryISO2) {
            updateCountryBorders(selectedCountryISO2);
        }
    });

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
});
