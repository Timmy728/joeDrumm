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
    map = L.map('map', {
        layers: [
            L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
                attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
            })
        ]
    }).setView([54.5, -4], 6);

    L.control.layers({
        "Streets": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"),
        "Satellite": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}")
    }).addTo(map);

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
            selectedCountryISO2 = iso2;
            updateCountryBorders(iso2);
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

    const phpFiles = [
        'countryName',
        'Population',
        'getWeather',
        'Timezone',
        'Currency',
        'latestExchangeRate',
        'wikipediaSearch',
        'earthQuakes',
        'getWeatherForecast'
    ];

    phpFiles.forEach((phpFile, index) => {
        L.easyButton(`fa-info fa-${index + 1}`, function () {
            if (selectedCountryISO2) {
                fetchDataAndShowModal(phpFile, selectedCountryISO2);
            } else {
                alert('Please select a country first.');
            }
        }).addTo(map);
    });

    function fetchDataAndShowModal(phpFile, iso2) {
        $.get(`Php/${phpFile}.Php`, { iso2: iso2 }, function (data) {
            let modalBody = '';
            switch (phpFile) {
                case 'countryName':
                    modalBody = `<p><strong>Country:</strong> ${data.name}</p><p><strong>Capital City:</strong> ${data.capital}</p>`;
                    break;
                case 'Population':
                    modalBody = `<p><strong>Population:</strong> ${data.population}</p>`;
                    break;
                case 'getWeather':
                    modalBody = `<p><strong>Temperature:</strong> ${data.temperature}°C</p><p><strong>Conditions:</strong> ${data.description}</p>`;
                    break;
                case 'Timezone':
                    modalBody = `<p><strong>Timezone:</strong> ${data.timezone}</p>`;
                    break;
                case 'Currency':
                    modalBody = `<p><strong>Currency:</strong> ${data.name} (${data.code}) - ${data.symbol}</p>`;
                    break;
                case 'latestExchangeRate':
                    modalBody = `<p><strong>Exchange Rate:</strong> 1 USD = ${data.exchangeRate} ${data.currencyCode}</p>`;
                    break;
                case 'wikipediaSearch':
                    modalBody = `<p><a href='${data.url}' target='_blank'>View on Wikipedia</a></p>`;
                    break;
                case 'earthQuakes':
                    modalBody = data.earthquakes.map(quake =>
                        `<p>Magnitude: ${quake.magnitude}, Depth: ${quake.depth}km, Location: (${quake.lat}, ${quake.lng}), Time: ${quake.datetime}</p>`
                    ).join('');
                    break;
                case 'getWeatherForecast':
                    modalBody = data.map(forecast =>
                        `<p>${forecast.date}: ${forecast.min_temp}°C - ${forecast.max_temp}°C</p>`
                    ).join('');
                    break;
                default:
                    modalBody = '<p>No data available.</p>';
            }

            $('#countryInfoLabel').text(`${phpFile.replace(/([A-Z])/g, ' $1')}`);
            $('.modal-body').html(modalBody);
            $('#countryInfoModal').modal('show');
        }, 'json');
    }
});
