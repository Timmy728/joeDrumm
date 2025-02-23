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

// Initialize the map with basemaps and easy buttons
$(document).ready(function () {
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

    map = L.map('map', {
        layers: [streets]
    }).setView([20, 0], 2);

    L.control.layers(basemaps).addTo(map);

    // EasyButtons for each PHP file
    const modals = [
        { id: 'countryInfoModal', label: 'fa-flag', modal: '#countryInfoModal' },
        { id: 'capitalCityModal', label: 'fa-city', modal: '#capitalCityModal' },
        { id: 'populationModal', label: 'fa-users', modal: '#populationModal' },
        { id: 'currencyModal', label: 'fa-money-bill', modal: '#currencyModal' },
        { id: 'exchangeRateModal', label: 'fa-exchange-alt', modal: '#exchangeRateModal' },
        { id: 'currentWeatherModal', label: 'fa-cloud-sun', modal: '#currentWeatherModal' },
        { id: 'weatherForecastModal', label: 'fa-calendar-alt', modal: '#weatherForecastModal' },
        { id: 'wikipediaModal', label: 'fa-wikipedia-w', modal: '#wikipediaModal' },
        { id: 'timezoneModal', label: 'fa-clock', modal: '#timezoneModal' },
        { id: 'earthquakeModal', label: 'fa-mountain', modal: '#earthquakeModal' }
    ];

    modals.forEach(btn => {
        L.easyButton(btn.label, function () {
            $(btn.modal).modal('show');
        }).addTo(map);
    });

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

    // Fetch data for all categories
    function fetchAllCountryData(iso2) {
        displayCountryInfo(iso2);
        displayCapitalCity(iso2);
        displayPopulation(iso2);
        displayCurrency(iso2);
        displayExchangeRate(iso2);
        displayCurrentWeather(iso2);
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

    // Example function for fetching country info
    function displayCountryInfo(iso2) {
        $.get('Php/countryName.Php', { iso2: iso2 }, function (data) {
            $('#countryNames').text(data.name);
        }, 'json');
    }

    // Similarly, implement other display functions for the remaining modals
});
