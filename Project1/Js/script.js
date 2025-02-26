$(window).on('load', function () {
    if ($('#preloader').length) {
        $('#preloader').delay(1000).fadeOut('slow', function () {
            $(this).remove();
        });
    }
});

let map;
let bordersLayer;
let earthquakeLayer, capitalCityLayer, weatherLayer;

$(document).ready(function () {
    // Initialize the map
    map = L.map('map').setView([20, 0], 2);

    // Add tile layers
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

    // Define custom icons
    var earthquakeIcon = L.ExtraMarkers.icon({
        icon: 'fa-bolt',
        markerColor: 'red',
        shape: 'circle',
        prefix: 'fa'
    });

    var capitalCityIcon = L.ExtraMarkers.icon({
        icon: 'fa-city',
        markerColor: 'blue',
        shape: 'square',
        prefix: 'fa'
    });

    var weatherIcon = L.ExtraMarkers.icon({
        icon: 'fa-cloud',
        markerColor: 'green',
        shape: 'star',
        prefix: 'fa'
    });

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
        displayEarthquakeData(iso2);
        displayWeather(iso2);
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

    function displayCountryInfo(iso2) {
        $.get('Php/countryName.Php', { iso2: iso2 }, function (data) {
            $('#countryNames').text(data.name);
            $('#countryFlag').attr('src', `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`).show();
        }, 'json');
    }

    function displayCapitalCity(iso2) {
        $.get('Php/capitalCities.Php', { iso2: iso2 }, function (data) {
            $('#capitalCity').text(data.capital);
            if (capitalCityLayer) {
                map.removeLayer(capitalCityLayer);
            }
            capitalCityLayer = L.marker([data.lat, data.lon], { icon: capitalCityIcon }).addTo(map);
        }, 'json');
    }

    function displayEarthquakeData(iso2) {
        $.get('Php/earthQuakes.Php', { country: iso2 }, function (data) {
            if (earthquakeLayer) {
                map.removeLayer(earthquakeLayer);
            }
            earthquakeLayer = L.layerGroup();
            data.earthquakes.forEach(quake => {
                let marker = L.marker([quake.lat, quake.lng], { icon: earthquakeIcon })
                    .bindPopup(`Magnitude: ${quake.magnitude}<br>Depth: ${quake.depth}km`);
                earthquakeLayer.addLayer(marker);
            });
            earthquakeLayer.addTo(map);
        }, 'json');
    }

    function displayWeather(iso2) {
        $.get('Php/getWeather.Php', { iso2: iso2 }, function (data) {
            $('#tempToday').text(data.temperature);
            $('#conditionsToday').text(data.description);
            if (weatherLayer) {
                map.removeLayer(weatherLayer);
            }
            weatherLayer = L.marker([data.lat, data.lon], { icon: weatherIcon }).addTo(map);
        }, 'json');
    }
});
