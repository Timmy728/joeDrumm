let map;
let bordersLayer;
let weatherMarkerGroup;
let selectedCountryISO2;
let countryBordersData;

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

// **Add Test Marker for Icon Verification**
L.marker([51.505, -0.09]).addTo(map).bindPopup("Test Marker").openPopup();

// **Initialize Marker Groups**
weatherMarkerGroup = L.markerClusterGroup(); // Initialize MarkerCluster for weather markers
map.addLayer(weatherMarkerGroup);

// **Load Country Borders from GeoJSON**
fetch("Data/countryBorders.geo.json")
  .then((response) => response.json())
  .then((data) => {
    countryBordersData = data;
  })
  .catch((error) => console.error("Error loading country borders:", error));

// **Marker Icon Configuration**
const markerIcon = L.icon({
  iconUrl: 'Images/marker-icon.png',  // Local marker icon
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'Images/marker-shadow.png',  // Local shadow image
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
    },
    error: function (error) {
      console.error("Error fetching weather:", error);
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

// **Fetch and Display Earthquakes**
const displayEarthquakes = (iso2) => {
  $.ajax({
    url: "php/earthQuakes.php",
    method: "GET",
    data: { iso2 },
    dataType: "json",
    success: function (data) {
      let earthquakeInfo = "";
      data.earthquakes.forEach((earthquake) => {
        earthquakeInfo += `<p>Magnitude: ${earthquake.magnitude} - Location: ${earthquake.location}</p>`;
      });
      $("#earthquakeInfo").html(earthquakeInfo);
    },
    error: function (error) {
      console.error("Error fetching earthquake data:", error);
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

// **Fetch and Display Weather Forecast (16-day)**
const displayWeatherForecast = (lat, lon) => {
  $.ajax({
    url: "php/getWeatherForecast.php", // Endpoint for 16-day forecast
    method: "GET",
    data: { lat, lon },
    dataType: "json",
    success: function (data) {
      let forecastHtml = "<h4>16-Day Weather Forecast</h4>";
      data.forecast.forEach((forecast) => {
        forecastHtml += `
          <p>${forecast.date}: ${forecast.temp} °C, ${forecast.description}</p>
        `;
      });

      // Optionally, create a marker for each forecasted location
      const forecastMarker = L.marker([lat, lon]).bindPopup(forecastHtml);
      weatherMarkerGroup.addLayer(forecastMarker); // Add to cluster group

      // Optionally, update the DOM or display the forecast data in a different section
      $("#forecastInfo").html(forecastHtml);
    },
    error: function (error) {
      console.error("Error fetching weather forecast:", error);
    },
  });
};

// **Handle Country Selection**
$("#selCountry").on("change", function () {
  selectedCountryISO2 = $(this).val();

  updateCountryBorders(selectedCountryISO2);
  displayCountryInfo(selectedCountryISO2);
  displayPopulation(selectedCountryISO2);
  displayCurrency(selectedCountryISO2);
  displayExchangeRate(selectedCountryISO2);
  displayTimezone(selectedCountryISO2);
  displayCapitalCity(selectedCountryISO2);

  const country = countryBordersData.features.find(
    (feature) => feature.properties.iso_a2 === selectedCountryISO2
  );
  if (country) {
    const [lon, lat] = country.properties.center;
    displayWeather(lat, lon); // Add weather marker to the cluster
    displayWeatherForecast(lat, lon); // Add weather forecast
  }

  displayEarthquakes(selectedCountryISO2);
  displayWikipediaInfo(selectedCountryISO2);
});

// **Geolocation**
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 10);

      $.ajax({
        url: "php/countryName.php",
        method: "GET",
        data: { lat: latitude, lon: longitude },
        dataType: "json",
        success: function (data) {
          $("#selCountry").val(data.iso2).change();
        },
        error: function (error) {
          console.error("Error fetching country from geolocation:", error);
        },
      });
    },
    (error) => {
      console.error("Geolocation error:", error);
    }
  );
}
