// Wait for document load
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
    // Initialize the map with layers
    const streets = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
    });

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    });

    let basemaps = {
        "Streets": streets,
        "Satellite": satellite
    };

    map = L.map('map', {
        layers: [streets]
    }).setView([54.5, -4], 6);

    L.control.layers(basemaps).addTo(map);

    // Populate dropdown list
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

    // Handle country selection
    $('#countrySelect').change(function () {
        const iso2 = $(this).val();
        if (iso2) {
            fetchCountryData(iso2);
        }
    });

    function fetchCountryData(iso2) {
        selectedCountryISO2 = iso2;
        zoomToCountry(iso2);
        fetchAllModalsData(iso2);
    }

    function zoomToCountry(iso2) {
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

    function fetchAllModalsData(iso2) {
        fetchDataAndBindModal('Php/countryName.Php', iso2, 'countryNames', '#countryInfoModal', 'name');
        fetchDataAndBindModal('Php/capitalCities.Php', iso2, 'capitalCity', '#capitalCityModal', 'capital');
        fetchDataAndBindModal('Php/Population.Php', iso2, 'population', '#populationModal', 'population');
        fetchDataAndBindModal('Php/Currency.Php', iso2, 'currencyName', '#currencyModal', 'name');
        fetchDataAndBindModal('Php/latestExchangeRate.php', iso2, 'txtCurrencyRate', '#exchangeRateModal', 'exchangeRate');
        fetchDataAndBindModal('Php/getWeather.Php', iso2, 'tempToday', '#weatherModal', 'temperature');
        fetchDataAndBindModal('Php/getWeatherForecast.Php', iso2, 'forecastInfo', '#forecastModal', 'forecast');
        fetchDataAndBindModal('Php/wikipediaSearch.Php', iso2, 'wikiLink', '#wikipediaModal', 'url', true);
        fetchDataAndBindModal('Php/Timezone.Php', iso2, 'timezone', '#timezoneModal', 'timezone');
        fetchDataAndBindModal('Php/earthQuakes.Php', iso2, 'earthquakeList', '#earthquakeModal', 'earthquakes');
    }

    function fetchDataAndBindModal(apiUrl, iso2, elementId, modalId, dataKey, isLink = false) {
        $.get(apiUrl, { iso2: iso2 }, function (data) {
            if (isLink) {
                $(`#${elementId}`).attr('href', data[dataKey]).text(`View on Wikipedia`);
            } else {
                $(`#${elementId}`).text(data[dataKey] || 'No data available');
            }
        }, 'json');
    }

    // Adding EasyButtons for each modal
    const modalIds = [
        'countryInfoModal', 'capitalCityModal', 'populationModal', 'currencyModal',
        'exchangeRateModal', 'weatherModal', 'forecastModal', 'wikipediaModal',
        'timezoneModal', 'earthquakeModal'
    ];

    modalIds.forEach((modalId, index) => {
        L.easyButton(`fa-${index + 1}`, function () {
            $(`#${modalId}`).modal('show');
        }).addTo(map);
    });
});
