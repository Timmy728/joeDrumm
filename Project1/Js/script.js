$(window).on('load', function () {
    if ($('#preloader').length) {
        $('#preloader').delay(1000).fadeOut('slow', function () {
            $(this).remove();
        });
    }
});

let map;
let bordersLayer;
let earthquakeMarkers = L.layerGroup();

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

    // Add EasyButtons
    L.easyButton('fa-info-circle', function () {
        $('#infoModal1').modal('show');
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

    // Detect User Location & Set Country
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            $.get(`https://restcountries.com/v3.1/all`, function (data) {
                let userCountry = data.find(country => {
                    return country.latlng && Math.abs(country.latlng[0] - lat) < 5 && Math.abs(country.latlng[1] - lon) < 5;
                });

                if (userCountry) {
                    $('#countrySelect').val(userCountry.cca2).change();
                }
            });
        });
    }

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

    function displayCountryInfo(iso2) {
        $.get('Php/countryName.Php', { iso2: iso2 }, function (data) {
            $('#countryNames').text(data.name);
            $('#countryFlag').attr('src', `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`).show();
            $('#population').text(data.population);
            $('#timezone').text(data.timezone);
        }, 'json');
    }

    function displayWeather(iso2) {
        $.get('Php/getWeather.Php', { iso2: iso2 }, function (data) {
            $('#tempToday').text(data.temperature);
            $('#conditionsToday').text(data.description);
        }, 'json');
    }

    function displayWikipediaInfo(iso2) {
        $.get('Php/wikipediaSearch.Php', { query: iso2 }, function (data) {
            $('#wikiLink').attr('href', data.url).text(`View ${data.title} on Wikipedia`);
            $('#wikiSummary').text(data.summary);
        }, 'json');
    }

function displayEarthquakeData(iso2) {
    $.get('Php/earthQuakes.Php', { country: iso2 }, function (data) {
        console.log("Earthquake Data Received:", data); // Debugging

        if (data.earthquakes && data.earthquakes.length > 0) {
            data.earthquakes.forEach(quake => {
                let lat = parseFloat(quake.lat);
                let lng = parseFloat(quake.lng);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    L.marker([lat, lng], {
                        icon: L.ExtraMarkers.icon({
                            icon: 'fa-bolt',
                            markerColor: 'red',
                            shape: 'square',
                            prefix: 'fa'
                        })
                    }).addTo(map)
                    .bindPopup(`<strong>Magnitude:</strong> ${quake.magnitude}<br>
                                <strong>Depth:</strong> ${quake.depth}km<br>
                                <strong>Time:</strong> ${quake.datetime}`);
                } else {
                    console.warn("Invalid earthquake coordinates:", quake);
                }
            });
        } else {
            console.warn("No earthquake data available.");
        }
    }, 'json').fail(function (jqXHR, textStatus, errorThrown) {
        console.error("Error fetching earthquake data:", textStatus, errorThrown);
    });
}
