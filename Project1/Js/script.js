$(window).on('load', function () {
    if ($('#preloader').length) {
        $('#preloader').delay(1000).fadeOut('slow', function () {
            $(this).remove();
        });
    }
});

// ---------------------------------------------------------
// GLOBAL DECLARATIONS
// ---------------------------------------------------------

var map;
var bordersLayer;
var selectedCountryISO2;
var countryBordersData;
var markerClusterGroup;

// Tile Layers
var streets = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
});

var satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
});

var basemaps = {
    "Streets": streets,
    "Satellite": satellite
};

// Info Button
var infoBtn = L.easyButton("fa-info fa-xl", function (btn, map) {
    $("#infoModal").modal("show");
});

// ---------------------------------------------------------
// EVENT HANDLERS
// ---------------------------------------------------------

$(document).ready(function () {
    // Initialize the map
    map = L.map("map", {
        layers: [streets],
        maxZoom: 18
    }).fitWorld();
    
    L.control.layers(basemaps).addTo(map);
    infoBtn.addTo(map);
    
    // Initialize MarkerCluster
    markerClusterGroup = L.markerClusterGroup();
    map.addLayer(markerClusterGroup);
    
    // Load country borders
    fetch("Data/countryBorders.geo.json")
        .then(response => response.json())
        .then(data => {
            countryBordersData = data;
        })
        .catch(error => console.error("Error loading country borders:", error));
    
    // Fetch country list
    $.ajax({
        url: "Php/countryName.Php",
        type: "GET",
        dataType: "json",
        success: function (data) {
            populateCountryDropdown(data);
        },
        error: function (xhr, status, error) {
            console.error("Error fetching country data:", error);
        }
    });
    
    function populateCountryDropdown(countries) {
        const dropdown = $("#selCountry");
        dropdown.empty();
        dropdown.append(new Option("Select a Country", ""));
        countries.forEach(function (country) {
            if (country.name && country.iso2) {
                dropdown.append(new Option(country.name, country.iso2));
            }
        });
    }
    
    $("#selCountry").change(function () {
        const iso2 = $(this).val();
        if (iso2) {
            selectedCountryISO2 = iso2;
            updateCountryBorders(iso2);
            displayCountryInfo(iso2);
            displayPopulation(iso2);
            displayWeather(iso2);
            displayTimezone(iso2);
            displayWeatherForecast(iso2);
            displayCurrency(iso2);
            displayExchangeRate(iso2);
        }
    });
    
    function updateCountryBorders(iso2) {
        if (bordersLayer) {
            map.removeLayer(bordersLayer);
        }
        
        const country = countryBordersData.features.find(
            feature => feature.properties.iso_a2 === iso2
        );
        
        if (country) {
            bordersLayer = L.geoJSON(country, {
                style: {
                    color: "blue",
                    weight: 2,
                    fillColor: "orange",
                    fillOpacity: 0.2
                }
            }).addTo(map);
            map.fitBounds(bordersLayer.getBounds());
        } else {
            console.error(`Country borders for ${iso2} not found.`);
        }
    }
    
    function displayCountryInfo(iso2) {
        $.ajax({
            url: "Php/countryName.Php",
            method: "GET",
            data: { iso2: iso2 },
            dataType: "json",
            success: function (data) {
                if (data.error) {
                    console.error("Error fetching country info:", data.error);
                    return;
                }
                $("#modalCountryName").text(data.name);
                $("#modalCapitalCity").text(data.capital);
                $("#modalPopulation").text(data.population);
                $("#modalCurrency").text(data.currency);
                $("#modalWeather").text(data.weather);
                $("#modalTimezone").text(data.timezone);
                $("#infoModal").modal("show");
            },
            error: function (error) {
                console.error("Error fetching country info:", error);
            }
        });
    }
    
    function displayPopulation(iso2) {
        $.ajax({
            url: "Php/Population.Php",
            method: "GET",
            data: { countryCode: iso2 },
            dataType: "json",
            success: function (data) {
                $("#population").text(data.population || "Data not available.");
            },
            error: function (error) {
                console.error("Error fetching population:", error);
                $("#population").text("Failed to fetch data.");
            }
        });
    }
    
    function displayWeather(iso2) {
        $.ajax({
            url: "Php/getWeather.Php",
            method: "GET",
            data: { iso2: iso2 },
            dataType: "json",
            success: function (data) {
                $("#tempToday").text(data.temperature);
                $("#conditionsToday").text(data.description);
                $("#weatherImg").html(`<img src="${data.icon}" alt="Weather Icon">`);
            },
            error: function (error) {
                console.error("Error fetching weather:", error);
                $("#tempToday").text("Error loading weather");
            }
        });
    }
    
    function displayExchangeRate(iso2) {
        $.ajax({
            url: "Php/latestExchangeRate.php",
            method: "GET",
            data: { iso2: iso2 },
            dataType: "json",
            success: function (data) {
                $("#txtCurrencyRate").text(`1 USD = ${data.exchangeRate} ${data.currencyCode}`);
            },
            error: function (error) {
                console.error("Error fetching exchange rate:", error);
                $("#txtCurrencyRate").text("Error loading exchange rate");
            }
        });
    }
});
