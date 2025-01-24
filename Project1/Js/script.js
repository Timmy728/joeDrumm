let map;
let bordersLayer;
let selectedCountryISO2;
let countryBordersData;

// Check if MarkerCluster is loaded before initializing
let markerClusterGroup;

document.addEventListener("DOMContentLoaded", function () {
  // Ensure MarkerCluster is available
  if (typeof L.markerClusterGroup !== "function") {
    console.error("MarkerCluster is not loaded correctly. Check your library paths.");
    return;
  }

  // Initialize MarkerClusterGroup
  markerClusterGroup = L.markerClusterGroup();

  // **Tile Layers**
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

  // **Initialize Map**
  map = L.map("map", {
    layers: [streets], // Default layer
    maxZoom: 18,
  }).fitWorld();

  // Add Layer Control
  L.control.layers(basemaps).addTo(map);

  // Add the MarkerCluster group to the map
  map.addLayer(markerClusterGroup);

  // **Add Test Marker for Icon Verification**
  L.marker([51.505, -0.09])
    .addTo(markerClusterGroup)
    .bindPopup("Test Marker")
    .openPopup();

  // **Load Country Borders from GeoJSON**
  fetch("Data/countryBorders.geo.json")
    .then((response) => response.json())
    .then((data) => {
      countryBordersData = data;
    })
    .catch((error) => console.error("Error loading country borders:", error));

  // **Marker Icon Configuration**
  const markerIcon = L.icon({
    iconUrl: "Images/marker-icon.png", // Local marker icon
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "Images/marker-shadow.png", // Local shadow image
    shadowSize: [41, 41],
  });

  // **Populate Country Dropdown**
  const populateCountryDropdown = () => {
    $.ajax({
      url: "php/countryName.php",
      method: "GET",
      dataType: "json",
      success: function (response) {
        response.forEach((country) => {
          $("#selCountry").append(
            $("<option>", {
              value: country.iso2,
              text: country.name,
            })
          );
        });
        $("#selCountry").prop("selectedIndex", 0);
      },
      error: function (error) {
        console.error("Error fetching country names:", error);
      },
    });
  };

  // **Update Country Borders**
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
    }
  };

  // **Fetch and Display Country Information**
  const displayCountryInfo = (iso2) => {
    $.ajax({
      url: "php/countryName.php",
      method: "GET",
      data: { iso2 },
      dataType: "json",
      success: function (data) {
        $("#countryNames").text(data.name);
        $("#iso2").text(data.iso2);
        $("#iso3").text(data.iso3);
      },
      error: function (error) {
        console.error("Error fetching country info:", error);
      },
    });
  };

  // **Fetch and Display Population**
  const displayPopulation = (iso2) => {
    $.ajax({
      url: "php/Population.php",
      method: "GET",
      data: { iso2 },
      dataType: "json",
      success: function (data) {
        $("#population").text(data.population);
      },
      error: function (error) {
        console.error("Error fetching population:", error);
      },
    });
  };

  // **Fetch and Display Weather**
  const displayWeather = (lat, lon) => {
    $.ajax({
      url: "php/getWeather.php",
      method: "GET",
      data: { lat, lon },
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

  // **Fetch and Display Timezone**
  const displayTimezone = (iso2) => {
    $.ajax({
      url: "php/Timezone.php",
      method: "GET",
      data: { iso2 },
      dataType: "json",
      success: function (data) {
        $("#timezone").text(data.timezone);
      },
      error: function (error) {
        console.error("Error fetching timezone:", error);
      },
    });
  };

  // **Fetch and Display Weather Forecast**
  const displayWeatherForecast = (lat, lon) => {
    $.ajax({
      url: "php/getWeatherForecast.php",
      method: "GET",
      data: { lat, lon },
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

  // **Fetch and Display Currency**
  const displayCurrency = (iso2) => {
    $.ajax({
      url: "php/Currency.php",
      method: "GET",
      data: { iso2 },
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

  // **Fetch and Display Exchange Rate**
  const displayExchangeRate = (iso2) => {
    $.ajax({
      url: "php/LatestExchangeRate.php",
      method: "GET",
      data: { iso2 },
      dataType: "json",
      success: function (data) {
        $("#txtCurrencyRate").text(data.rate);
      },
      error: function (error) {
        console.error("Error fetching exchange rate:", error);
      },
    });
  };

  // **Fetch and Display Capital City**
  const displayCapitalCity = (iso2) => {
    $.ajax({
      url: "php/capitalCities.php",
      method: "GET",
      data: { iso2 },
      dataType: "json",
      success: function (data) {
        $("#capitalCity").text(data.capital);
      },
      error: function (error) {
        console.error("Error fetching capital city:", error);
      },
    });
  };

  // **Fetch and Display Wikipedia Information**
  const displayWikipediaInfo = (query) => {
    $.ajax({
      url: "php/wikipediaSearch.php",
      method: "GET",
      data: { query },
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

  // **Handle Country Selection**
  $("#selCountry").on("change", function () {
    selectedCountryISO2 = $(this).val();
    updateCountryBorders(selectedCountryISO2);
    displayCountryInfo(selectedCountryISO2);
    displayPopulation(selectedCountryISO2);
    displayTimezone(selectedCountryISO2);

    const country = countryBordersData.features.find(
      (feature) => feature.properties.iso_a2 === selectedCountryISO2
    );

    if (country) {
      const [lon, lat] = country.properties.center;
      displayWeather(lat, lon);
      displayWeatherForecast(lat, lon);
    }

    displayCurrency(selectedCountryISO2);
    displayExchangeRate(selectedCountryISO2);
    displayCapitalCity(selectedCountryISO2);
    displayWikipediaInfo(selectedCountryISO2);
  });

  populateCountryDropdown();
});
