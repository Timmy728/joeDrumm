$(window).on('load', function () {
    if ($('#preloader').length) {
        $('#preloader').delay(1000).fadeOut('slow', function () {
            $(this).remove();
        });
    }
});

let map;
let bordersLayer;
let earthquakeLayer;
let capitalMarker = null;
let earthquakeMarkers = [];
let layerControl;

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

    map.on('locationfound', function (options) {
        console.log(options);

        $.ajax({
            url: 'Php/CountryCode.php',
            type: 'GET',
            dataType: 'json',
            data: { lat: options.latitude, lng: options.longitude },
            success: function (data) {
                console.log(data);
                $('#countrySelect').val(data.data.countryCode).change();
            },
            error: function (err) {
                console.log(err);
            }
        });
    });

    L.control.layers(basemaps).addTo(map);
    streets.addTo(map);

    // Add 5 EasyButtons
    L.easyButton('fa-flag', function () {
        $('#infoModal1').modal('show');
    }).addTo(map);

    L.easyButton('fa-map-marker-alt', function () {
        $('#infoModal2').modal('show');
    }).addTo(map);

    // Currency Button
    var infoBtn = L.easyButton("fa-solid fa-money-bill-transfer", function (btn, map) {
        loadCurrencies();
        $("#currencyModal").modal("show");
    }).addTo(map);

    L.easyButton('fa-cloud-sun', function () {
        $('#infoModal4').modal('show');
    }).addTo(map);

    L.easyButton('fa-globe', function () {
        $('#infoModal5').modal('show');
    }).addTo(map);

    loadCurrencies();

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
        }
    });

    $('#countrySelect').change(function () {
        const iso2 = $(this).val(); // Get the selected country ISO2 code
        if (iso2) {
            $.ajax({
                url: "Php/latestExchangeRate.php",
                type: 'GET',
                dataType: 'json',
                data: {
                    iso2: iso2  // Pass the selected country ISO2 code to the PHP script
                },
                success: function (result) {
                    console.log(result); // Log the response to inspect the structure

                    if (result.status && result.status.code == 200) {
                        const currencyCode = result.currencyCode;  // Currency code (e.g., GBP)
                        const exchangeRate = result.exchangeRate;  // Exchange rate (e.g., 0.771399)

                        const supportedCurrencies = ["USD", "EUR", "GBP", "AUD", "CAD"]; // Add supported currencies here

                        $('#currencies').empty();  // Clear existing options

                        // Add new options to the currency dropdown
                        supportedCurrencies.forEach(function (currency) {
                            $('#currencies').append(new Option(currency, currency));
                        });

                        // Set the selected currency in the dropdown
                        $('#currencies').val(currencyCode); // Set the selected currency based on the API response

                        // Update the currency exchange rate display
                        $('#txtCurrencyRate').text(`1 USD = ${exchangeRate} ${currencyCode}`);

                        // Set the "From" label dynamically
                        const fromLabel = `From ${$('#countrySelect option:selected').text()} 1 ${currencyCode}`;
                        $('#fromLabel').text(fromLabel);  // Set the "From" label

                        // If necessary, perform a conversion based on input values
                        calcResult(exchangeRate);
                    } else {
                        console.error("Error: " + result.error);
                    }
                },
                error: function (xhr, status, error) {
                    console.error("Error fetching exchange rate:", error);
                }
            });
        } else {
            console.error("No country selected. Please select a country.");
        }
    });

    // Currency modal event handlers
    $('#fromAmount').on('keyup', function () {
        calcResult();
    });

    $('#fromAmount').on('change', function () {
        calcResult();
    });

    $('#currencies').on('change', function () {
        calcResult();
    });

    // When the modal is shown, set the selected currency
    $('#currencyModal').on('show.bs.modal', function () {
        const selectedCountry = $('#countrySelect').val();
        if (selectedCountry) {
            $.ajax({
                url: "Php/latestExchangeRate.php",
                type: 'GET',
                dataType: 'json',
                data: {
                    iso2: selectedCountry
                },
                success: function (result) {
                    if (result && result.currencyCode) {
                        $('#currencies').val(result.currencyCode);
                        calcResult(result.exchangeRate);
                    }
                }
            });
        }
    });

    $('#currencyModal').on('hidden.bs.modal', function () {
        $('#fromAmount').val(1);
        calcResult();
    });

    // On country selection
    $('#countrySelect').change(function () {
        const iso2 = $(this).val();
        if (iso2) {
            clearPreviousCountryData();
            fetchAllCountryData(iso2);
            displayNearbyInfo(iso2);
        }
    });
});

function loadCurrencies() {
    $.ajax({
        url: "Php/latestExchangeRate.php",
        type: 'GET',
        dataType: 'json',
        success: function (result) {
            const currencySelect = $('#currencies');
            currencySelect.empty();

            if (result && result.data && Array.isArray(result.data)) {
                result.data.forEach(function (item) {
                    if (Array.isArray(item) && item.length >= 3) {
                        currencySelect.append(
                            $('<option>', {
                                value: item[0],
                                text: item[1],
                                'data-rate': item[2]
                            })
                        );
                    }
                });
            }
        }
    });
}

function calcResult(exchangeRate) {
    const selectedOption = $('#currencies option:selected');
    const rate = selectedOption.attr('data-rate');
    if (rate) {
        const fromAmount = parseFloat($('#fromAmount').val()) || 0;
        const result = fromAmount * parseFloat(rate);
        $('#toAmount').val(numeral(result).format('0,0.00'));
    }
}

function displayCurrency(iso2) {
    $.ajax({
        url: 'Php/latestExchangeRate.php',
        type: 'GET',
        dataType: 'json',
        data: { iso2: iso2 },
        success: function (data) {
            if (data && data.currencyCode) {
                $('#currencies').val(data.currencyCode);
                calcResult();
            }
        },
        error: function (xhr, status, error) {
            console.error('Error fetching currency:', error);
        }
    });
}

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
        }
    }, 'json');
}

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
    getRectBounds(iso2);
    displayCountryInfo(iso2);
    displayCapitalCity(iso2);
    displayCapitalOnMap(iso2);
    displayPopulation(iso2);
    displayCurrency(iso2);
    displayExchangeRate(iso2);
    displayWeather(iso2);
    displayWeatherForecast(iso2);
    displayWikipediaInfo(iso2);
    displayTimezone(iso2);
    updateCountryBorders(iso2);
}

function getWikiResults(north, south, east, west, iso2) {
    $.ajax({
        url: 'Php/wikipediaBoundingBox.php',
        type: 'GET',
        dataType: 'json',
        data: {north:north, south:south, east:east, west:west},
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
                            <li>${article.summary}<br/>
                            <a href='https://${article.wikipediaUrl}' target='_blank'>Click to see more...</a>
                            </li>
                        `);
                    });
                } else {
                    $('#wikiArticles').append("<li>No Wikipedia articles found for this country.</li>");
                }
            } else {
                $('#wikiArticles').append("<li>No Wikipedia data available.</li>");
            }
        },
        error: function (err) {
            console.log(err);
            $('#wikiArticles').append("<li>Error loading Wikipedia articles.</li>");
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
        data: {country:countryCode},
        success: function (data) {
            console.log(data);
            if (data.data && data.data[0]) {
                placeEarthQuakeMarkers(data.data[0].north, data.data[0].south, data.data[0].east, data.data[0].west);
                getWikiResults(data.data[0].north, data.data[0].south, data.data[0].east, data.data[0].west, countryCode);
            }
        },
        error:function(err){
            console.log(err);
        }
    });
}

function updateCountryBorders(iso2) {
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
    });
}

function displayCountryInfo(iso2) {
    $.get('Php/countryName.php', { iso2: iso2 }, function (data) {
        $('#countryNames').text(data.name);
        $('#countryFlag').attr('src', `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`).show();
    }, 'json');
}

function displayCapitalCity(iso2) {
    $.get('Php/capitalCities.php', { iso2: iso2 }, function (data) {
        $('#capitalCity').text(data.capital);
    }, 'json');
}

function displayCapitalOnMap(iso2) {
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
            }, 'json');
        }
    }, 'json');
}

function displayPopulation(iso2) {
    $.get('Php/Population.php', { countryCode: iso2 }, function (data) {
        $('#population').text(data.population);
    }, 'json');
}

function displayExchangeRate(iso2) {
    $.get('Php/latestExchangeRate.php', { iso2: iso2 }, function (data) {
        $('#txtCurrencyRate').text(`1 USD = ${data.exchangeRate} ${data.currencyCode}`);
        $('#convertBtn').off('click').on('click', function () {
            const amount = parseFloat($('#currencyAmount').val());
            if (!isNaN(amount)) {
                const convertedAmount = (amount * data.exchangeRate).toFixed(2);
                $('#convertedCurrency').text(`${amount} USD = ${convertedAmount} ${data.currencyCode}`);
            }
        });
    }, 'json');
}

function displayWeather(iso2) {
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
            }, 'json');
        } else {
            $('#tempToday').text('Coordinates not found');
            $('#conditionsToday').text('No description available');
            $('#weatherImg').empty();
        }
    }, 'json');
}

function displayWeatherForecast(iso2) {
    $.get('Php/getWeatherForecast.php', { location: iso2 }, function (data) {
        $('#forecastInfo').html('');
        data.forEach(forecast => {
            $('#forecastInfo').append(`<p>${forecast.date}: ${forecast.min_temp}°C - ${forecast.max_temp}°C</p>`);
        });
    }, 'json');
}

function displayWikipediaInfo(iso2) {
    $.get('Php/wikipediaSearch.php', { query: iso2 }, function (data) {
        $('#wikiLink').attr('href', data.url).text(`View ${data.title} on Wikipedia`);
    }, 'json');
}

function displayTimezone(iso2) {
    $.get('Php/Timezone.php', { iso2: iso2 }, function (data) {
        $('#timezone').text(data.timezone);
    }, 'json');
}
