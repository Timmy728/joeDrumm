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

    map.on('locationfound', function(options){
        console.log(options);

        $.ajax({
            url: 'Php/CountryCode.php',
            type: 'GET',
            dataType: 'json',
            data:{lat:options.latitude, lng:options.longitude},
            success: function (data) {
               console.log(data);
               if (data && data.data && data.data.countryCode) {
                   $('#countrySelect').val(data.data.countryCode).trigger('change');
               }
            },
            error:function(err){
                console.log(err);
            }
        });
    });

    L.control.layers(basemaps).addTo(map);
    streets.addTo(map);

    // Add EasyButtons
    L.easyButton('fa-flag', function () {
        $('#infoModal1').modal('show');
    }).addTo(map);

    L.easyButton('fa-newspaper', function () {
        $('#infoModal2').modal('show');
    }).addTo(map);

    // Currency Button
    L.easyButton({
        states: [{
            stateName: 'show-currency',
            icon: '<i class="fas fa-dollar-sign" style="font-size: 16px; color: #333;"></i>',
            title: 'Show Currency Converter',
            onClick: function() {
                loadCurrencies();
                $("#currencyModal").modal("show");
            }
        }]
    }).addTo(map);

    // Weather Button
    L.easyButton({
        states: [{
            stateName: 'show-weather',
            icon: '<i class="fas fa-cloud-sun" style="font-size: 16px; color: #333;"></i>',
            title: 'Show Weather Information',
            onClick: function() {
                const iso2 = $('#countrySelect').val();
                if (iso2) {
                    displayWeather(iso2);
                } else {
                    alert('Please select a country first');
                }
            }
        }]
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

            map.locate({
                setView: true,
                maxZoom: 5  // Reduced zoom level
            });
        },
        error: function(err) {
            console.error("Error loading countries:", err);
        }
    });

    // Currency modal event handlers
    $('#fromAmount').on('keyup change', function () {
        calcResult();
    });

    $('#currencies').on('change', function () {
        calcResult();
    });

    // Modal handlers
    $('#currencyModal').on('show.bs.modal', function () {
        const selectedCountry = $('#countrySelect').val();
        if (selectedCountry) {
            $.ajax({
                url: "Php/latestExchangeRate.php",
                type: 'GET',
                dataType: 'json',
                data: { iso2: selectedCountry },
                success: function (result) {
                    if (result && result.currencyCode) {
                        $('#currencies').val(result.currencyCode);
                        calcResult();
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

function calcResult() {
    const selectedOption = $('#currencies option:selected');
    const rate = selectedOption.attr('data-rate');
    if (rate) {
        const fromAmount = parseFloat($('#fromAmount').val()) || 0;
        const result = fromAmount * parseFloat(rate);
        $('#toAmount').val(numeral(result).format('0,0.00'));
    }
}

function formatDate(dateString) {
    return Date.parse(dateString).toString('ddd, dS MMM yyyy');
}

function formatTime(dateString) {
    return Date.parse(dateString).toString('HH:mm, dS MMM yyyy');
}

function formatNumber(number) {
    return numeral(number).format('0,0');
}

function formatCurrency(number) {
    return numeral(number).format('$0,0.00');
}

function displayWeather(iso2) {
    // Show loading state
    $('#pre-load').removeClass('fadeOut').show();
    
    $.ajax({
        url: 'Php/getWeatherForecast.php',
        type: 'GET',
        dataType: 'json',
        data: { location: iso2 },
        success: function(forecastResult) {
            if (forecastResult.status && forecastResult.status.code === 200) {
                const forecast = forecastResult.data.forecast;
                
                // Update forecast days
                if (forecast && forecast.length > 0) {
                    // Today
                    $('#todayConditions').text(forecast[0].conditionText);
                    $('#todayIcon').attr('src', forecast[0].conditionIcon)
                                 .attr('alt', forecast[0].conditionText);
                    $('#todayMaxTemp').text(formatNumber(forecast[0].maxC));
                    $('#todayMinTemp').text(formatNumber(forecast[0].minC));
                    
                    // Day 1
                    if (forecast.length > 1) {
                        $('#day1Date').text(formatDate(forecast[1].date));
                        $('#day1Icon').attr('src', forecast[1].conditionIcon)
                                    .attr('alt', forecast[1].conditionText);
                        $('#day1MinTemp').text(formatNumber(forecast[1].minC));
                        $('#day1MaxTemp').text(formatNumber(forecast[1].maxC));
                    }
                    
                    // Day 2
                    if (forecast.length > 2) {
                        $('#day2Date').text(formatDate(forecast[2].date));
                        $('#day2Icon').attr('src', forecast[2].conditionIcon)
                                    .attr('alt', forecast[2].conditionText);
                        $('#day2MinTemp').text(formatNumber(forecast[2].minC));
                        $('#day2MaxTemp').text(formatNumber(forecast[2].maxC));
                    }

                    // Day 3
                    if (forecast.length > 3) {
                        $('#day3Date').text(formatDate(forecast[3].date));
                        $('#day3Icon').attr('src', forecast[3].conditionIcon)
                                    .attr('alt', forecast[3].conditionText);
                        $('#day3MinTemp').text(formatNumber(forecast[3].minC));
                        $('#day3MaxTemp').text(formatNumber(forecast[3].maxC));
                    }
                }
                
                // Update modal title with location
                $('#weatherModalLabel').text(`${forecastResult.data.location}, ${forecastResult.data.country}`);
                
                // Update last updated timestamp
                $('#lastUpdated').text(formatTime(forecastResult.data.lastUpdated));
                
                // Hide loading state and show modal
                $('#pre-load').addClass('fadeOut').hide();
                $('#weatherModal').modal('show');
            } else {
                console.error('Weather data fetch failed:', forecastResult.error);
                $('#pre-load').addClass('fadeOut').hide();
                alert('Failed to fetch weather data. Please try again.');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX error:', textStatus, errorThrown);
            $('#pre-load').addClass('fadeOut').hide();
            alert('Failed to fetch weather data. Please try again.');
        }
    });
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
    // Get country bounds from the countryInfo endpoint
    $.ajax({
        url: 'Php/countryInfo.php',
        type: 'GET',
        dataType: 'json',
        data: { country: iso2 },
        success: function(data) {
            if (data && data.data && data.data[0]) {
                const bounds = data.data[0];
                placeEarthQuakeMarkers(bounds.north, bounds.south, bounds.east, bounds.west);
                getWikiResults(bounds.north, bounds.south, bounds.east, bounds.west, iso2);
                
                // Update map view with the country bounds
                updateCountryBorders(iso2);
            }
        }
    });

    displayCountryInfo(iso2);
    displayCapitalCity(iso2);
    displayCapitalOnMap(iso2);
    displayPopulation(iso2);
    displayCurrency(iso2);
    displayExchangeRate(iso2);
    displayWikipediaInfo(iso2);
    displayTimezone(iso2);
}

function displayCountryInfo(iso2) {
    $.get('Php/countryName.php', { iso2: iso2 }, function(data) {
        if (data && data.name) {
            $('#countryNames').text(data.name);
            $('#countryFlag').attr('src', `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`).show();
        }
    });
}

function displayCapitalCity(iso2) {
    $.get('Php/capitalCities.php', { iso2: iso2 }, function (data) {
        if (data && data.capital) {
            $('#capitalCity').text(data.capital);
        } else {
            $('#capitalCity').text('Not available');
        }
    }, 'json').fail(function() {
        $('#capitalCity').text('Not available');
    });
}

function displayCapitalOnMap(iso2) {
    $.get('Php/capitalCities.php', { iso2: iso2 }, function (data) {
        if (data && data.capital) {
            $.get('Php/countryInfo.php', { country: iso2 }, function(countryData) {
                if (countryData.data && countryData.data[0]) {
                    const bounds = countryData.data[0];
                    const center = L.latLng((bounds.north + bounds.south) / 2, (bounds.east + bounds.west) / 2);

                    var cityIcon = L.icon({
                        iconUrl: 'Images/CityBuildings.png',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32]
                    });

                    capitalMarker = L.marker(center, { icon: cityIcon })
                        .addTo(map)
                        .bindPopup(`<strong>Capital:</strong> ${data.capital}`);
                }
            });
        }
    }, 'json');
}

function displayPopulation(iso2) {
    $.get('Php/Population.php', { countryCode: iso2 }, function (data) {
        if (data && data.population) {
            $('#population').text(formatNumber(data.population));
        } else {
            $('#population').text('Not available');
        }
    }, 'json').fail(function() {
        $('#population').text('Not available');
    });
}

function displayExchangeRate(iso2) {
    $.get('Php/latestExchangeRate.php', { iso2: iso2 }, function (data) {
        if (data && data.exchangeRate && data.currencyCode) {
            $('#txtCurrencyRate').text(`1 USD = ${formatCurrency(data.exchangeRate)} ${data.currencyCode}`);
            $('#convertBtn').off('click').on('click', function () {
                const amount = parseFloat($('#currencyAmount').val());
                if (!isNaN(amount)) {
                    const convertedAmount = (amount * data.exchangeRate).toFixed(2);
                    $('#convertedCurrency').text(`${formatCurrency(amount)} USD = ${formatCurrency(convertedAmount)} ${data.currencyCode}`);
                }
            });
        } else {
            $('#txtCurrencyRate').text('Exchange rate not available');
        }
    }, 'json').fail(function() {
        $('#txtCurrencyRate').text('Exchange rate not available');
    });
}

function displayWikipediaInfo(iso2) {
    $.get('Php/wikipediaSearch.php', { query: iso2 }, function (data) {
        if (data && data.url && data.title) {
            $('#wikiLink').attr('href', data.url).text(`View ${data.title} on Wikipedia`);
        } else {
            $('#wikiLink').text('Wikipedia link not available');
        }
    }, 'json').fail(function() {
        $('#wikiLink').text('Wikipedia link not available');
    });
}

function displayTimezone(iso2) {
    $.ajax({
        url: 'Php/Timezone.php',
        type: 'GET',
        dataType: 'json',
        data: { iso2: iso2 },
        success: function(data) {
            if (data && data.timezone) {
                // Replace escaped slashes (\/) with regular slashes (/)
                const timezone = data.timezone.replace(/\\\//g, '/');
                $('#timezone').text(timezone);  // Display the corrected timezone
            } else {
                $('#timezone').text('Not available');
            }
        },
        error: function() {
            $('#timezone').text('Not available');
        }
    });
}

function updateCountryBorders(iso2) {
    if (bordersLayer) {
        map.removeLayer(bordersLayer);
    }
    
    $.getJSON('https://joedrumm.co.uk/Project1/Data/countryBorders.geo.json', function(data) {
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
            
            // Set appropriate zoom level based on country size
            const bounds = bordersLayer.getBounds();
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 6  // Limit maximum zoom level
            });
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
                            <strong>📍 Magnitude:</strong> ${formatNumber(quake.magnitude)}<br>
                            <strong>📏 Depth:</strong> ${formatNumber(quake.depth)} km<br>
                            <strong>⏰ Time:</strong> ${formatTime(quake.datetime)}<br>
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
