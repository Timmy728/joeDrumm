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

// Check if MarkerCluster is loaded before initializing
let markerClusterGroup;

  $(document).ready(function () {
 //Fetch country data when the page loads
  $.ajax({
     url: "Php/countryName.Php",
     type: "GET",
     dataType: "json",
     success: function (data) {
    console.log("Response from countryName.php:", data); 

       if (Array.isArray(data) && data.length > 0) {
         populateCountryDropdown(data); 
       } else {
         console.error("No valid country data found.");
       }
     },
     error: function (xhr, status, error) {
       console.error("Error fetching country data:", error);
     },
   });

  function populateCountryDropdown(countries) {
    const dropdown = $("#selCountry");
    dropdown.empty(); // Clear any existing options

    dropdown.append(new Option("Select Country", ""));

    // Loop through the array of countries and add options to the dropdown
    countries.forEach(function (country) {
      // Make sure the country has the expected properties (name and iso2)
      if (country.name && country.iso2) {
        dropdown.append(new Option(country.name, country.iso2)); // Display country name, store iso2 code
      }
    });
  }

  if (typeof L.markerClusterGroup !== "function") {
    console.error("MarkerCluster is not loaded correctly. Check your library paths.");
  }

  // Initialize MarkerClusterGroup
  markerClusterGroup = L.markerClusterGroup();

  const streets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  });

  const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    }
  );

  const basemaps = {
    Streets: streets,
    Satellite: satellite,
  };

  map = L.map("map", {
    layers: [streets], // Default layer
    maxZoom: 18,
  }).fitWorld();

  L.control.layers(basemaps).addTo(map);

  // Add the MarkerCluster group to the map
  map.addLayer(markerClusterGroup);

  L.marker([51.505, -0.09])
    .addTo(markerClusterGroup)
    .bindPopup("Test Marker")
    .openPopup();

  fetch("Data/countryBorders.geo.json")
    .then((response) => response.json())
    .then((data) => {
      countryBordersData = data;
    })
    .catch((error) => console.error("Error loading country borders:", error));

  // Marker icon setup
  const markerIcon = L.icon({
    iconUrl: "images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "images/marker-shadow.png", 
    shadowSize: [41, 41],
  });

  const updateCountryBorders = (iso2) => {
    if (bordersLayer) {
      map.removeLayer(bordersLayer);
    }

    const country = countryBordersData.features.find(
      (feature) => feature.properties.iso_a2 === iso2
    );

    if (country) {
      bordersLayer = L.geoJSON(country, {
        style: {
          color: "blue",
          weight: 2,
          fillColor: "orange",
          fillOpacity: 0.2,
        },
      }).addTo(map);
      map.fitBounds(bordersLayer.getBounds());
    } else {
      console.error(`Country borders for ${iso2} not found.`);
    }
  };

   const displayCountryInfo = (iso2) => {
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
         $("#countryNames").text(data.name);
         $("#iso2").text(data.iso2);
         $("#iso3").text(data.iso3);
       },
       error: function (error) {
         console.error("Error fetching country info:", error);
       },
     });
   };

   const displayPopulation = (iso2) => {
    $.ajax({
      url: "Php/Population.Php", // Ensure this is the correct path to your Population.php
      method: "GET",
      data: { countryCode: iso2 },  // Pass the correct country code (iso2)
      dataType: "json",
      success: function (data) {
        // Log the data to check the response from the server
        console.log(data);
  
        // Check if the population data is available and update the DOM
        if (data && data.population) {
          // Display only the population number, without the word "Population"
          $("#population").text(data.population);
        } else {
          // If no population data is found, display a message
          $("#population").text("Data not available.");
        }
      },
      error: function (xhr, status, error) {
        // Handle any AJAX errors
        console.error("Error fetching population data:", error);
        $("#population").text("Failed to fetch data.");
      },
    });
  };
  
  // When the country is selected from the dropdown, call the displayPopulation function
  $("#countrySelect").change(function () {
    const selectedCountry = $(this).val(); // Get the country code (iso2) from the dropdown
    if (selectedCountry) {
      displayPopulation(selectedCountry);  // Call the function with the selected country code
    }
  });


const getCountryCoordinates = (countryName) => {
  const apiKey = "6c0c78ec2bda4c27ae734ca2b9eaffe4";  // Your OpenCage API key
  const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(countryName)}&key=${apiKey}`;

  return $.ajax({
    url: apiUrl,
    method: "GET",
    dataType: "json",
  });
};

// Function to fetch and display weather
const displayWeather = (lat, lon) => {
  if (!lat || !lon) {
    console.error("Latitude and longitude are required.");
    return;
  }

  $.ajax({
    url: "Php/getWeather.Php",
    method: "GET",
    data: { lat: lat, lon: lon },
    dataType: "json",
    success: function (data) {
      console.log("Weather Data:", data);

      if (data.error) {
        console.error("Error fetching weather:", data.error);
        $("#tempToday").text("Error: " + data.error);
        return;
      }

      // Populate the elements with data
      $("#tempToday").text(data.temperature);
      $("#conditionsToday").text(data.description);
      $("#weatherImg").html(`<img src="${data.icon}" alt="Weather Icon">`);
    },
    error: function (error) {
      console.error("Error fetching weather:", error);
      $("#tempToday").text("Error loading weather");
    },
  });
};

// Event listener for country selection
$("#selCountry").change(function () {
  const countryName = $(this).val();  // Get selected country name

  // Fetch coordinates using OpenCage API
  getCountryCoordinates(countryName)
    .done(function (data) {
      if (data.results && data.results.length > 0) {
        const lat = data.results[0].geometry.lat;
        const lon = data.results[0].geometry.lng;
        displayWeather(lat, lon);  // Fetch and display weather
      } else {
        console.error("Coordinates not found for", countryName);
        $("#tempToday").text("Error: Location not found");
      }
    })
    .fail(function (error) {
      console.error("Error fetching coordinates:", error);
    });
});
      
displayWeather(51.5074, -0.1278);  // London (default)


      
   const displayTimezone = (iso2) => {
     $.ajax({
       url: "Php/Timezone.Php",
       method: "GET",
       data: { iso2: iso2 },
       dataType: "json",
       success: function (data) {
         $("#timezone").text(data.timezone);
       },
       error: function (error) {
         console.error("Error fetching timezone:", error);
       },
     });
   };

      
   const displayWeatherForecast = (location) => {
    console.log("Fetching weather for:", location);

    $.ajax({
        url: "Php/getWeatherForecast.Php",
        method: "GET",
        data: { location: location },  // Send location name instead of lat/lon
        dataType: "json",
        success: function (data) {
            console.log("Weather Data:", data);
            if (data.error) {
                console.error("Error fetching weather:", data.error);
                $("#forecastInfo").html(`<p>${data.error}</p>`);
                return;
            }

            let forecastHtml = `<h1>10-Day Weather History for ${location}</h1>`;
            data.forEach((forecast) => {
              let minTemp = forecast.min_temp !== null ? forecast.min_temp + "°C" : "No Data";
              let maxTemp = forecast.max_temp !== null ? forecast.max_temp + "°C" : "No Data";
              
              forecastHtml += `<p>${forecast.date}: ${minTemp} - ${maxTemp}</p>`;
              
            });

            $("#forecastInfo").html(forecastHtml);
        },
        error: function (error) {
            console.error("Error fetching weather forecast:", error);
            $("#forecastInfo").html("<p>Could not retrieve forecast.</p>");
        },
    });
};
$("#searchButton").on("click", function () {
    let userLocation = $("#locationInput").val();  // Get user input from text field
    displayWeatherForecast(userLocation);
});


const displayCurrency = (iso2) => {
    console.log("Fetching currency for:", iso2);
  
    $.ajax({
      url: "Php/Currency.Php",  // Ensure the path to your PHP file is correct
      method: "GET",
      data: { iso2: iso2 },      // Pass iso2 to the PHP script
      dataType: "json",
      success: function (data) {
        console.log("API Response:", data);
  
        // Check if the response contains currency data
        if (data && data.currencies && data.currencies.length > 0) {
          let currency = data.currencies[0];  // Assuming the first currency in the array is the one to display
          let currencyName = currency.name || "Currency name not available";
          let currencyCode = currency.code || "Currency code not available";
          let currencySymbol = currency.symbol || "Currency symbol not available";
  
          // Display the currency code and symbol in the HTML element
          $("#currencyName").text(`${currencyName} (${currencyCode}) - ${currencySymbol}`);
        } else {
          // Handle missing currency data
          console.error("Currency data not found.");
          $("#currencyName").text("Currency not available");
        }
      },
      error: function (error) {
        console.error("Error fetching currency data:", error);
        $("#currencyName").text("Error loading currency");
      }
    });
  };

  const displayExchangeRate = (iso2) => {
    $.ajax({
        url: "/Project1/Php/latestExchangeRate.php?iso2=AU",
        method: "GET",
        data: { iso2: iso2 },
        dataType: "json",
        success: function (data) {
            console.log("API Response:", data);

            if (data.exchangeRate) {
                $("#txtCurrencyRate").text(`1 USD = ${data.exchangeRate} ${data.currencyCode}`);
            } else {
                $("#txtCurrencyRate").text("Exchange rate not available");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error fetching exchange rate:", xhr.responseText);
            $("#txtCurrencyRate").text("Error loading exchange rate");
        },
    });
};
displayExchangeRate("GB");

      
$(document).ready(function() {
  $.ajax({
    url: "https://restcountries.com/v3.1/all", // Get all countries
    method: "GET",
    dataType: "json",
    success: function(data) {
      // Populate the select with country names and their ISO2 codes
      const countrySelect = $("#selCountry");
      data.forEach(country => {
        const iso2 = country.cca2; // Country ISO2 code
        const countryName = country.name.common; // Country name
        countrySelect.append(new Option(countryName, iso2)); // Add option to select
      });
    },
    error: function(error) {
      console.error("Error fetching countries:", error);
    }
  });

  // Event listener to call displayCapitalCity when a country is selected
  $("#selCountry").change(function() {
    const iso2 = $(this).val(); // Get the selected country's ISO2 code
    displayCapitalCity(iso2); // Call the function to display the capital city
  });
});

// Function to fetch and display the capital city
const displayCapitalCity = (iso2) => {
  $.ajax({
    url: "Php/capitalCities.Php",
    method: "GET",
    data: { iso2: iso2 },
    dataType: "json",
    success: function (data) {
      if (data.capital) {
        $("#capitalCity").text(data.capital); // Display capital city
      } else {
        $("#capitalCity").text("Capital not found");
      }
    },
    error: function (error) {
      console.error("Error fetching capital city:", error);
      $("#capitalCity").text("Error fetching capital city");
    },
  });
};

const displayWikipediaInfo = (query) => {
  $.ajax({
    url: "Php/wikipediaSearch.Php",
    method: "GET",
    data: { query: query },
    dataType: "json",
    success: function (response) {
      if (response.error || response.results.length === 0) {
        $("#wikiLink").hide().text("No Wikipedia entry found.");
        return;
      }

      const firstResult = response.results[0]; // Take the first entry

      $("#wikiLink")
        .attr("href", firstResult.link)
        .text(`View ${firstResult.title} on Wikipedia`)
        .show(); // Ensure the link is visible
    },
    error: function (error) {
      console.error("Error fetching Wikipedia data:", error);
      $("#wikiLink").hide().text("Error fetching data.");
    },
  });
};
$("#selCountry").change(function () {
  const selectedCountry = $("#selCountry option:selected").text();
  displayWikipediaInfo(selectedCountry);
});


      
   $(document).ready(function () {
    function loadEarthquakes(countryCode) {
        console.log("Loading earthquakes for:", countryCode);

        $.ajax({
            url: "Php/earthQuakes.Php?country=USA",
            type: "GET",
            data: { country: countryCode },
            dataType: "json",
            success: function (response) {
                console.log("Earthquake Data Response:", response);

                let earthquakeList = $("#earthquakeList");
                earthquakeList.html(""); // Clear old data

                if (response.earthquakes && Array.isArray(response.earthquakes) && response.earthquakes.length > 0) {
                    response.earthquakes.forEach(function (quake) {
                        let datetime = quake.datetime || "Unknown Date";
                        let magnitude = quake.magnitude || "N/A";
                        let depth = quake.depth || "N/A";
                        let lat = quake.lat || "N/A";
                        let lng = quake.lng || "N/A";

                        earthquakeList.append(
                            `<p>📍 <strong>Magnitude:</strong> ${magnitude} | <strong>Depth:</strong> ${depth}km | <strong>Location:</strong> (Lat: ${lat}, Lng: ${lng}) | <strong>Time:</strong> ${datetime}</p>`
                        );
                    });
                } else {
                    earthquakeList.html("<p>No recent earthquakes found.</p>");
                }
            },
            error: function (xhr, status, error) {
                console.error("AJAX Error:", status, error);
                $("#earthquakeList").html("<p>Error fetching earthquake data.</p>");
            }
        });
    }

    // Trigger on country selection
    $("#selCountry").on("change", function () {
        let selectedCountry = $(this).val();
        console.log("Country selected:", selectedCountry);
        loadEarthquakes(selectedCountry);
    });

    // Load default country earthquakes (e.g., US)
    loadEarthquakes("US");
});



  $("#selCountry").on("change", function () {
        const iso2 = $(this).val();

        if (iso2) {
            selectedCountryISO2 = iso2;
            updateCountryBorders(iso2);
            displayCountryInfo(iso2);
            displayPopulation(iso2);
            displayWeather(iso2); // Include lat, lon from data if needed
            displayTimezone(iso2);
            displayWeatherForecast(iso2);
            displayCurrency(iso2);
            displayExchangeRate(iso2);
        }
    });
});
