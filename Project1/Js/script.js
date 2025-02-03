let map;
let bordersLayer;
let selectedCountryISO2;
let countryBordersData;

// Check if MarkerCluster is loaded before initializing
let markerClusterGroup;

(JQuery):$(window).on('load', function () {if ($('#preloader').length) {$('#preloader').delay(1000).fadeOut('slow', function () {$(this).remove();});}});

$(document).ready(function () {
  // Fetch country data when the page loads
  $.ajax({
    url: "php/countryName.php", // Ensure this URL matches the path to your PHP file
    type: "GET",
    dataType: "json",
    success: function (data) {
      console.log("Response from countryName.php:", data); // Log raw response

      // Check if data is valid and is an array
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

  // Function to populate the country dropdown
  function populateCountryDropdown(countries) {
    const dropdown = $("#selCountry");
    dropdown.empty(); // Clear any existing options

    // Add a default 'Select Country' option
    dropdown.append(new Option("Select Country", ""));

    // Loop through the array of countries and add options to the dropdown
    countries.forEach(function (country) {
      // Make sure the country has the expected properties (name and iso2)
      if (country.name && country.iso2) {
        dropdown.append(new Option(country.name, country.iso2)); // Display country name, store iso2 code
      }
    });
  }

  // Ensure MarkerCluster is available
  if (typeof L.markerClusterGroup !== "function") {
    console.error("MarkerCluster is not loaded correctly. Check your library paths.");
    return;
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

  // **Add Test Marker for Icon Verification**
  L.marker([51.505, -0.09])
    .addTo(markerClusterGroup)
    .bindPopup("Test Marker")
    .openPopup();

  // Fetch country borders
  fetch("Data/countryBorders.geo.json")
    .then((response) => response.json())
    .then((data) => {
      countryBordersData = data;
    })
    .catch((error) => console.error("Error loading country borders:", error));

  // Marker icon setup
  const markerIcon = L.icon({
    iconUrl: "Images/marker-icon.png", // Local marker icon
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "Images/marker-shadow.png", // Local shadow image
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
      url: "php/Population.php",
      method: "GET",
      data: { iso2: iso2 }, // Ensure iso2 is passed properly
      dataType: "json",
      success: function (data) {
        $("#population").text(data.population);
      },
      error: function (error) {
        console.error("Error fetching population:", error);
      },
    });
  };

  const displayWeather = (lat, lon) => {
    $.ajax({
      url: "php/getWeather.php",
      method: "GET",
      data: { lat: lat, lon: lon }, // Send lat and lon for weather
      dataType: "json",
      success: function (data) {
        $("#tempToday").text(`${data.temp} °C`);
        $("#conditionsToday").text(data.description);
        $("#weatherImg").html(
          `<img src="https://openweathermap.org/img/wn/${data.icon}.png" alt="Weather Icon">`
        );

        const weatherMarker = L.marker([lat, lon], { icon: markerIcon }).bindPopup(
          `<h4>Weather Info</h4><p>${data.temp} °C - ${data.description}</p>`
        );
        markerClusterGroup.addLayer(weatherMarker);
      },
      error: function (error) {
        console.error("Error fetching weather:", error);
      },
    });
  };

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
    $.ajax({
      url: "php/getWeatherForecast.php",
      method: "GET",
      data: { lat: lat, lon: lon },
      dataType: "json",
      success: function (data) {
        let forecastHtml = "<h4>16-Day Weather Forecast</h4>";
        data.forecast.forEach((forecast) => {
          forecastHtml += `<p>${forecast.date}: ${forecast.temp} °C, ${forecast.description}</p>`;
        });

        const forecastMarker = L.marker([lat, lon]).bindPopup(forecastHtml);
        markerClusterGroup.addLayer(forecastMarker);
        $("#forecastInfo").html(forecastHtml);
      },
      error: function (error) {
        console.error("Error fetching weather forecast:", error);
      },
    });
  };

  const displayCurrency = (iso2) => {
    $.ajax({
      url: "php/Currency.php",
      method: "GET",
      data: { iso2: iso2 },
      dataType: "json",
      success: function (data) {
        $("#currencyName").text(data.name);
        $("#currencySymbol").text(data.symbol);
        $("#txtCurrencyCode").text(data.code);
      },
      error: function (error) {
        console.error("Error fetching currency:", error);
      },
    });
  };

  const displayExchangeRate = (iso2) => {
    $.ajax({
      url: "php/LatestExchangeRate.php",
      method: "GET",
      data: { iso2: iso2 },
      dataType: "json",
      success: function (data) {
        $("#txtCurrencyRate").text(data.rate);
      },
      error: function (error) {
        console.error("Error fetching exchange rate:", error);
      },
    });
  };

  const displayCapitalCity = (iso2) => {
    $.ajax({
      url: "php/capitalCities.php",
      method: "GET",
      data: { iso2: iso2 },
      dataType: "json",
      success: function (data) {
        $("#capitalCity").text(data.capital);
      },
      error: function (error) {
        console.error("Error fetching capital city:", error);
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

  // Earthquake data integration
  const displayEarthquakes = () => {
    $.ajax({
      url: "php/earthQuakes.php", // Corrected the PHP file name
      method: "GET",
      dataType: "json",
      success: function (data) {
        data.features.forEach((earthquake) => {
          const coords = earthquake.geometry.coordinates;
          const magnitude = earthquake.properties.mag;
          const place = earthquake.properties.place;

          const earthquakeMarker = L.marker([coords[1], coords[0]]).bindPopup(
            `<strong>Magnitude:</strong> ${magnitude}<br><strong>Location:</strong> ${place}`
          );
          markerClusterGroup.addLayer(earthquakeMarker);
        });
      },
      error: function (error) {
        console.error("Error fetching earthquake data:", error);
      },
    });
  };

  // Event listener for country selection
  $("#selCountry").change(function () {
    const iso2 = $(this).val();
    if (iso2) {
      selectedCountryISO2 = iso2;
      updateCountryBorders(iso2);
      displayCountryInfo(iso2);
      displayPopulation(iso2);
      displayTimezone(iso2);
      displayCurrency(iso2);
      displayExchangeRate(iso2);
      displayCapitalCity(iso2);
      displayWikipediaInfo(iso2);
      displayWeatherForecast(iso2);
      displayWeather(iso2);
      displayEarthquakes();
    }
  });
});
