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
     url: "php/countryName.php", // Ensure this URL matches the path to your PHP file
     type: "GET",
     dataType: "json",
     success: function (data) {
    console.log("Response from countryName.php:", data); // Log raw response

       if (Array.isArray(data) && data.length > 0) {
         populateCountryDropdown(data); // Populate the dropdown
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
       url: "php/countryName.php", // Ensure the path to PHP file is correct
       method: "GET",
       data: { iso2: iso2 }, // Ensure iso2 is passed properly
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
      url: "php/Population.php", // Ensure this is the correct path to your Population.php
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
    url: "php/getWeather.php",
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
       url: "php/Timezone.php",
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

      

   const displayWeatherForecast = (lat, lon) => {
    console.log("Latitude:", lat);  // Log latitude
    console.log("Longitude:", lon);  // Log longitude
  
    var url = `php/getWeatherForecast.php?lat=${lat}&lon=${lon}`;
    console.log("Request URL:", url);  // Log request URL
  
    $.ajax({
      url: url,  // Make sure the URL is correct
      method: "GET",
      dataType: "json",
      success: function (data) {
        console.log("Weather Data:", data);  // Log the returned data
        if (data.error) {
          console.error("Error fetching weather data:", data.error);
          return;
        }
  
        let forecastHtml = "<h4>4-Day Weather Forecast</h4>";
        data.forEach((forecast) => {
          forecastHtml += `<p>${forecast.date}: ${forecast.min_temp} °C - ${forecast.max_temp} °C, ${forecast.condition}</p>`;
        });
  
        // Update the weather forecast info on the webpage
        $("#forecastInfo").html(forecastHtml);
      },
      error: function (error) {
        console.error("Error fetching weather forecast:", error);
      },
    });
  };


const displayCurrency = (iso2) => {
    console.log("Fetching currency for:", iso2);
  
    $.ajax({
      url: "php/currency.php",  // Ensure the path to your PHP file is correct
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
        url: "php/latestExchangeRate.php",
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
    url: "php/capitalCities.php",
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
       url: "php/wikipediaSearch.php",
       method: "GET",
       data: { query: query },
       dataType: "json",
       success: function (data) {
         $("#wiki-title").text(data.title);
         $("#wiki-info").html(data.extract);
         $("#wiki-img").html(`<img src="${data.thumbnail}" alt="Wiki Image">`);
       },
       error: function (error) {
         console.error("Error fetching Wikipedia data:", error);
       },
     });
   };

const displayEarthquakes = () => {
  $.ajax({
    url: "php/earthQuakes.php", // Make sure this path is correct
    method: "GET",
    dataType: "json",
    success: function (data) {
      // Log the entire response to understand its structure
      console.log("Earthquake data:", data);
      
      // Check if the data has features and if it's an array
      if (data && Array.isArray(data.features)) {
        data.features.forEach((earthquake) => {
          const coords = earthquake.geometry.coordinates;
          const magnitude = earthquake.properties.mag;
          const place = earthquake.properties.place;

          // Check if the coordinates are valid (should be an array with at least two values)
          if (coords && coords.length >= 2) {
            const earthquakeMarker = L.marker([coords[1], coords[0]])
              .bindPopup(
                `<strong>Magnitude:</strong> ${magnitude}<br><strong>Location:</strong> ${place}`
              );
            markerClusterGroup.addLayer(earthquakeMarker);
          } else {
            console.error("Invalid coordinates for earthquake:", earthquake);
          }
        });
      } else {
        console.error("Invalid data format or no features found in the response:", data);
      }
    },
    error: function (xhr, status, error) {
      // More detailed error handling
      console.error("Error fetching earthquake data:");
      console.error("Status: " + status);
      console.error("Error: " + error);
      console.error("Response Text: ", xhr.responseText);
      
      // Notify user of failure
      alert("Sorry, there was an error fetching earthquake data. Please try again later.");
    },
  });
};


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
