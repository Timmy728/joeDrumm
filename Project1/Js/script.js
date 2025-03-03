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

$(document).ready(function () {
    // Initialize the map
    map = L.map('map').setView([20, 0], 2);
    
    // Initialize marker cluster group
    earthquakeLayer = L.markerClusterGroup();

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

    function displayNearbyInfo(iso2) {
    $.get(`https://restcountries.com/v3.1/alpha/${iso2}`, function (countryData) {
        if (countryData && countryData[0] && countryData[0].latlng) {
            let lat = countryData[0].latlng[0];
            let lon = countryData[0].latlng[1];

            // Fetch all 4 PHP APIs using lat/lon
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
            // Clear previous data when a new country is selected
            clearPreviousCountryData();
            fetchAllCountryData(iso2);
            displayNearbyInfo(iso2);
        }
    });

    // Function to clear previous country data
    function clearPreviousCountryData() {
        // Clear earthquake markers
        earthquakeLayer.clearLayers();
        
        // Remove earthquake layer from map and re-add it (empty)
        if (map.hasLayer(earthquakeLayer)) {
            map.removeLayer(earthquakeLayer);
        }
        map.addLayer(earthquakeLayer);
        
        // Remove capital marker if it exists
        if (capitalMarker) {
            map.removeLayer(capitalMarker);
            capitalMarker = null;
        }
        
        // Clear country borders if they exist
        if (bordersLayer) {
            map.removeLayer(bordersLayer);
            bordersLayer = null;
        }
        
        // Clear Wikipedia articles
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

    function getWikiResults(north, south, east, west, iso2){
        $.ajax({
            url: 'Php/wikipediaBoundingBox.php',
            type: 'GET',
            dataType: 'json',
            data:{north:north, south:south, east:east, west:west},
            success: function (data) {
                console.log("Wikipedia Data:", data);
                $('#wikiArticles').html('');
                
                if (data.data && data.data.length > 0) {
                    let filteredArticles = data.data.filter(article => {
                        return article.countryCode === iso2; // Filter articles by country code
                    });

                    if (filteredArticles.length > 0) {
                        filteredArticles.forEach(article => {
                            $('#wikiArticles').append(`
                                <li>
                                    ${article.summary} <br>
                                    <a href="https://${article.wikipediaUrl}" target="_blank">Click to see more...</a>
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
                console.error("Error fetching Wikipedia data:", err);
                $('#wikiArticles').append("<li>Error loading Wikipedia articles.</li>");
            }
        });
    }

   function placeEarthQuakeMarkers(north, south, east, west) {
        $.ajax({
            url: 'Php/earthQuakes.php',
            type: 'GET',
            dataType: 'json',
            data: { north: north, south: south, east: east, west: west },
            success: function (data) {
                if (!data.data || data.data.length === 0) return;
                
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
                        let marker = L.marker([lat, lng], { icon: redIcon })
                            .bindPopup(`
                                <strong>Magnitude:</strong> ${quake.magnitude}<br>
                                <strong>Depth:</strong> ${quake.depth} km<br>
                                <strong>Time:</strong> ${quake.datetime}<br>
                            `);
                        earthquakeLayer.addLayer(marker);
                    }
                });
            }
        });
    }

    function getRectBounds(countryCode){
        console.log(countryCode);
        $.ajax({
            url: 'Php/countryInfo.php',
            type: 'GET',
            dataType: 'json',
            data:{country:countryCode},
            success: function (data) {
                console.log(data);
                if (data.data && data.data[0]) {
                    placeEarthQuakeMarkers(data.data[0].north, data.data[0].south, data.data[0].east, data.data[0].west, countryCode);
                    getWikiResults(data.data[0].north, data.data[0].south, data.data[0].east, data.data[0].west, countryCode);
                }
            },error:function(err){
                console.log(err);
            }
        });
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

    // Functions to fetch and display data
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
                $.get(`https://restcountries.com/v3.1/alpha/${iso2}`, function (countryData) {
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
                });
            }
        });
    }
});
    
    function displayPopulation(iso2) {
        $.get('Php/Population.php', { countryCode: iso2 }, function (data) {
            $('#population').text(data.population);
        }, 'json');
    }

    function displayCurrency(iso2) {
        $.get('Php/Currency.php', { iso2: iso2 }, function (data) {
            if (data && data.currencies && data.currencies.length > 0) {
                let currency = data.currencies[0];
                $('#currencyName').text(`${currency.name}`);
                $('#currencySymbol').text(currency.symbol);
            }
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
    $.get('https://restcountries.com/v3.1/alpha/' + iso2, function (data) {
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


    // function displayEarthquakeData(iso2) {
    //     $.get('Php/earthQuakes.php', { country: iso2 }, function (data) {
    //         console.log(data);
    //         let earthquakeHtml = '';
    //         data.earthquakes.forEach(quake => {
    //             earthquakeHtml += `<p>📍 Magnitude: ${quake.magnitude} | Depth: ${quake.depth}km | Location: (${quake.lat}, ${quake.lng}) | Time: ${quake.datetime}</p>`;
    //         });
    //         $('#earthquakeList').html(earthquakeHtml);
    //     }, 'json');
    // }
