// Preloader code - will be removed after first country loads
let preloaderRemoved = false;
let map;
let bordersLayer;
let earthquakeLayer;
let capitalMarker = null;
let earthquakeMarkers = [];

function removePreloader() {
    if (!preloaderRemoved && $('.preloader').length) {
        $('.preloader').addClass('fade-out');
        // Remove preloader after fade animation
        setTimeout(function() {
            $('.preloader').remove();
            preloaderRemoved = true;
        }, 500); // Match the CSS transition duration
    }
}

$(document).ready(function () {
    // Initialize the map with maxZoom specified
    map = L.map('map', {
        maxZoom: 18,
        minZoom: 2
    }).setView([20, 0], 2);
    
    // Initialize marker cluster group
    earthquakeLayer = L.markerClusterGroup();
    map.addLayer(earthquakeLayer);

    // Add tile layers
    var streets = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
        maxZoom: 18
    });

    var satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
        maxZoom: 18
    });

    var basemaps = {
        "Streets": streets,
        "Satellite": satellite
    };

    map.on('locationfound', function(options){
        console.log(options);

        $.ajax({
            url: 'Php/CountryCode.php',
            type: 'GET',
            dataType: 'json',
            data:{lat:options.latitude, lng:options.longitude},
            success: function (data) {
               console.log(data);
               $('#countrySelect').val(data.data.countryCode).change();
            },error:function(err){
                console.log(err);
                removePreloader();
            }
        });
    });

    L.control.layers(basemaps).addTo(map);
    streets.addTo(map);

    // Add 5 EasyButtons with immediate data loading
    L.easyButton('fa-flag', function () {
        displayCountryInfo($('#countrySelect').val());
        displayCapitalCity($('#countrySelect').val());
        displayPopulation($('#countrySelect').val());
        displayTimezone($('#countrySelect').val());
        $('#infoModal1').modal('show');
    }).addTo(map);

    L.easyButton('fa-map-marker-alt', function () {
        displayNearbyInfo($('#countrySelect').val());
        $('#infoModal2').modal('show');
    }).addTo(map);

    L.easyButton('fa-exchange-alt', function () {
        displayCurrency($('#countrySelect').val());
        displayExchangeRate($('#countrySelect').val());
        $('#infoModal3').modal('show');
    }).addTo(map);

    L.easyButton('fa-cloud-sun', function () {
        displayWeather($('#countrySelect').val());
        displayWeatherForecast($('#countrySelect').val());
        $('#infoModal4').modal('show');
    }).addTo(map);

    L.easyButton('fa-globe', function () {
        const iso2 = $('#countrySelect').val();
        $.ajax({
            url: 'Php/countryInfo.php',
            type: 'GET',
            dataType: 'json',
            data: {country: iso2},
            success: function(data) {
                if (data.data && data.data[0]) {
                    getWikiResults(data.data[0].north, data.data[0].south, data.data[0].east, data.data[0].west, iso2);
                }
            }
        });
        displayWikipediaInfo(iso2);
        $('#infoModal5').modal('show');
    }).addTo(map);

    // Populate countries dropdown
    $.ajax({
        url: 'Php/countryName.php',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            console.log(data);
            const dropdown = $('#countrySelect');
            dropdown.empty();
            dropdown.append(new Option('Select a Country', ''));
            data.forEach(function (country) {
                if (country.name && country.iso2) {
                    dropdown.append(new Option(country.name, country.iso2));
                }
            });

            map.locate();
        },
        error: function(err) {
            console.log(err);
            removePreloader();
        }
    });

    function displayNearbyInfo(iso2) {
        $.get('Php/getCountryData.php', { iso2: iso2 }, function (countryData) {
            if (countryData && countryData[0] && countryData[0].latlng) {
                let lat = countryData[0].latlng[0];
                let lon = countryData[0].latlng[1];

                $.get('Php/findNearbyStreets.php', { lat, lon }, function (streetData) {
                    $('#nearbyStreets').text(streetData.length > 0 ? streetData.map(street => street.name).join(", ") : "No streets found.");
                }, 'json');

                $.get('Php/findNearbyPlaceName.php', { lat, lon }, function (placeData) {
                    $('#nearbyPlaces').text(placeData.length > 0 ? placeData.map(place => place.name).join(", ") : "No places found.");
                }, 'json');

                $.get('Php/astergdem.php', { lat, lon }, function (elevationData) {
                    $('#elevation').text(elevationData.elevation ? `${elevationData.elevation}m` : "No elevation data.");
                }, 'json');

                $.get('Php/geoCodeAddress.php', { lat, lon }, function (addressData) {
                    $('#geoAddress').text(addressData.street ? `${addressData.street}, ${addressData.adminName1}` : "No address found.");
                }, 'json');

            } else {
                console.warn("No lat/lon data available for this country.");
            }
        }, 'json').fail(function () {
            console.error("Error fetching country lat/lon data from RestCountries API.");
        });
    }
    
    // On country selection
    $('#countrySelect').change(function () {
        const iso2 = $(this).val();
        if (iso2) {
            clearPreviousCountryData();
            fetchAllCountryData(iso2);
            displayNearbyInfo(iso2);
        }
    });

    function clearPreviousCountryData() {
        earthquakeLayer.clearLayers();
        if (capitalMarker) {
            map.removeLayer(capitalMarker);
            capitalMarker = null;
        }
        if (bordersLayer) {
            map.removeLayer(bordersLayer);
            bordersLayer = null;
        }
        $('#wikiArticles').html('');
    }

    function fetchAllCountryData(iso2) {
        let loadedDataCount = 0;
        const totalDataPoints = 11;

        function checkAllDataLoaded() {
            loadedDataCount++;
            if (loadedDataCount === totalDataPoints) {
                removePreloader();
            }
        }

        getRectBounds(iso2);
        displayCountryInfo(iso2, checkAllDataLoaded);
        displayCapitalCity(iso2, checkAllDataLoaded);
        displayCapitalOnMap(iso2, checkAllDataLoaded);
        displayPopulation(iso2, checkAllDataLoaded);
        displayCurrency(iso2, checkAllDataLoaded);
        displayExchangeRate(iso2, checkAllDataLoaded);
        displayWeather(iso2, checkAllDataLoaded);
        displayWeatherForecast(iso2, checkAllDataLoaded);
        displayWikipediaInfo(iso2, checkAllDataLoaded);
        displayTimezone(iso2, checkAllDataLoaded);
        updateCountryBorders(iso2, checkAllDataLoaded);
    }

    function getWikiResults(north, south, east, west, iso2) {
        $.ajax({
            url: 'Php/wikipediaBoundingBox.php',
            type: 'GET',
            dataType: 'json',
            data: {north: north, south: south, east: east, west: west},
            success: function (data) {
                console.log("Wikipedia Data:", data);
                $('#wikiArticles').html('');
                
                if (data.data && data.data.length > 0) {
                    let filteredArticles = data.data.filter(article => {
                        return article.countryCode === iso2;
                    });

                    if (filteredArticles.length > 0) {
                        filteredArticles.forEach(article => {
                            $('#wikiArticles').append(`
                                <div class="wiki-article mb-3">
                                    <h5>${article.title}</h5>
                                    <p>${article.summary}</p>
                                    <a href='https://${article.wikipediaUrl}' target='_blank' class="btn btn-sm btn-primary">Read More</a>
                                </div>
                            `);
                        });
                    } else {
                        $('#wikiArticles').append("<p>No Wikipedia articles found for this country.</p>");
                    }
                } else {
                    $('#wikiArticles').append("<p>No Wikipedia data available.</p>");
                }
            },
            error: function (err) {
                console.log(err);
                $('#wikiArticles').append("<p>Error loading Wikipedia articles.</p>");
            }
        });
    }

    function placeEarthQuakeMarkers(north, south, east, west) {
        console.log("📡 Fetching Earthquake Data...");

        $.ajax({
            url: 'Php/earthQuakes.php',
            type: 'GET',
            dataType: 'json',
            data: { north: north, south: south, east: east, west: west },
            success: function (data) {
                console.log("✅ Earthquake Data Received:", data);

                if (!data.data || data.data.length === 0) {
                    console.warn("⚠️ No earthquake data found.");
                    return;
                }

                var redIcon = L.icon({
                    iconUrl: 'Images/Fire-Icon.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                });

                data.data.forEach(quake => {
                    let lat = parseFloat(quake.lat);
                    let lng = parseFloat(quake.lng);

                    if (!isNaN(lat) && !isNaN(lng)) {
                        console.log("📍 Adding Marker:", lat, lng);

                        let marker = L.marker([lat, lng], { icon: redIcon })
                            .bindPopup(`
                                <strong>📍 Magnitude:</strong> ${quake.magnitude}<br>
                                <strong>📏 Depth:</strong> ${quake.depth} km<br>
                                <strong>⏰ Time:</strong> ${quake.datetime}<br>
                                <strong>🌍 Location:</strong> ${lat}, ${lng}
                            `);
                        
                        earthquakeLayer.addLayer(marker);
                    } else {
                        console.warn("⚠️ Invalid earthquake coordinates:", quake);
                    }
                });
            },
            error: function (xhr, status, error) {
                console.error("❌ Error fetching earthquake data:", status, error);
            }
        });
    }

    function getRectBounds(countryCode) {
        console.log(countryCode);
        $.ajax({
            url: 'Php/countryInfo.php',
            type: 'GET',
            dataType: 'json',
            data: {country: countryCode},
            success: function (data) {
                console.log(data);
                if (data.data && data.data[0]) {
                    placeEarthQuakeMarkers(data.data[0].north, data.data[0].south, data.data[0].east, data.data[0].west);
                    getWikiResults(data.data[0].north, data.data[0].south, data.data[0].east, data.data[0].west, countryCode);
                }
            },
            error: function(err) {
                console.log(err);
            }
        });
    }

    function updateCountryBorders(iso2, callback) {
        if (bordersLayer) {
            map.removeLayer(bordersLayer);
        }
        
        $.getJSON('Php/getCountryBorders.php', { iso2: iso2 }, function (country) {
            if (country && !country.error) {
                bordersLayer = L.geoJSON(country, {
                    style: {
                        color: 'blue',
                        weight: 2,
                        fillColor: 'orange',
                        fillOpacity: 0.3
                    }
                }).addTo(map);
                map.fitBounds(bordersLayer.getBounds());
            } else {
                console.error("Error loading country borders:", country ? country.error : "Unknown error");
            }
            if (callback) callback();
        });
    }
});

function displayCountryInfo(iso2, callback) {
    $.get('Php/countryName.php', { iso2: iso2 }, function (data) {
        $('#countryNames').text(data.name);
        $('#countryFlag').attr('src', `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`).show();
        if (callback) callback();
    }, 'json');
}

function displayCapitalCity(iso2, callback) {
    $.get('Php/capitalCities.php', { iso2: iso2 }, function (data) {
        $('#capitalCity').text(data.capital);
        if (callback) callback();
    }, 'json');
}

function displayCapitalOnMap(iso2, callback) {
    $.get('Php/capitalCities.php', { iso2: iso2 }, function (data) {
        if (data.capital) {
            $.get('Php/getCountryData.php', { iso2: iso2 }, function (countryData) {
                if (countryData && countryData[0] && countryData[0].latlng) {
                    let lat = countryData[0].latlng[0];
                    let lon = countryData[0].latlng[1];

                    var cityIcon = L.icon({
                        iconUrl: 'Images/CityBuildings.png',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32]
                    });

                    capitalMarker = L.marker([lat, lon], { icon: cityIcon })
                        .addTo(map)
                        .bindPopup(`<strong>Capital:</strong> ${data.capital}`);
                }
                if (callback) callback();
            }, 'json');
        } else {
            if (callback) callback();
        }
    }, 'json');
}

function displayPopulation(iso2, callback) {
    $.get('Php/Population.php', { countryCode: iso2 }, function (data) {
        $('#population').text(data.population);
        if (callback) callback();
    }, 'json');
}

function displayCurrency(iso2, callback) {
    $.get('Php/Currency.php', { iso2: iso2 }, function (data) {
        if (data && data.currencies && data.currencies.length > 0) {
            let currency = data.currencies[0];
            $('#currencyName').text(`${currency.name}`);
            $('#currencySymbol').text(currency.symbol);
        }
        if (callback) callback();
    }, 'json');
}

function displayExchangeRate(iso2, callback) {
    $.get('Php/latestExchangeRate.php', { iso2: iso2 }, function (data) {
        $('#txtCurrencyRate').text(`1 USD = ${data.exchangeRate} ${data.currencyCode}`);
        $('#convertBtn').off('click').on('click', function () {
            const amount = parseFloat($('#currencyAmount').val());
            if (!isNaN(amount)) {
                const convertedAmount = (amount * data.exchangeRate).toFixed(2);
                $('#convertedCurrency').text(`${amount} USD = ${convertedAmount} ${data.currencyCode}`);
            }
        });
        if (callback) callback();
    }, 'json');
}

function displayWeather(iso2, callback) {
    $.get('Php/getCountryData.php', { iso2: iso2 }, function (data) {
        if (data && data[0] && data[0].latlng) {
            const [lat, lon] = data[0].latlng;

            $.get('Php/getWeather.php', { lat: lat, lon: lon }, function (weatherData) {
                if (weatherData && weatherData.temperature && weatherData.description) {
                    $('#tempToday').text(`${weatherData.temperature}°C`);
                    $('#conditionsToday').text(weatherData.description);
                    $('#weatherImg').html(`<img src="${weatherData.icon}" alt="Weather Icon">`);
                } else {
                    $('#tempToday').text('No weather data available');
                    $('#conditionsToday').text('No description available');
                    $('#weatherImg').empty();
                }
                if (callback) callback();
            }, 'json');
        } else {
            $('#tempToday').text('Coordinates not found');
            $('#conditionsToday').text('No description available');
            $('#weatherImg').empty();
            if (callback) callback();
        }
    }, 'json');
}

function displayWeatherForecast(iso2, callback) {
    $.get('Php/getWeatherForecast.php', { location: iso2 }, function (data) {
        $('#forecastInfo').html('');
        data.forEach(forecast => {
            $('#forecastInfo').append(`
                <div class="forecast-day mb-2">
                    <strong>${forecast.date}:</strong>
                    <span class="ms-2">${forecast.min_temp}°C - ${forecast.max_temp}°C</span>
                </div>
            `);
        });
        if (callback) callback();
    }, 'json');
}

function displayWikipediaInfo(iso2, callback) {
    $.get('Php/wikipediaSearch.php', { query: iso2 }, function (data) {
        $('#wikiLink').attr('href', data.url).text(`View ${data.title} on Wikipedia`);
        if (callback) callback();
    }, 'json');
}

function displayTimezone(iso2, callback) {
    $.get('Php/Timezone.php', { iso2: iso2 }, function (data) {
        $('#timezone').text(data.timezone);
        if (callback) callback();
    }, 'json');
}
