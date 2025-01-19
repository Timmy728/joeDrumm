let map;
let bordersLayer;
let weatherMarkerGroup;
let selectedCountryISO2;
let countryBordersData;

// Tile layers
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

// Initialize map
map = L.map("map", {
  layers: [streets],
  maxZoom: 18,
}).fitWorld();

// Initialize marker groups
weatherMarkerGroup = L.markerClusterGroup();

// Load country borders from geoJSON
fetch("Data/countryBorders.geo.json")
  .then((response) => response.json())
  .then((data) => {
    countryBordersData = data;
  })
  .catch((error) => console.error("Error loading country borders:", error));

// Populate country dropdown
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

// Update map with country borders
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

// Fetch and display country information
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

// Fetch and display population
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

// Fetch and display weather
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

// Fetch and display currency
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

// Handle country selection
$("#selCountry").on("change", function () {
  selectedCountryISO2 = $(this).val();

  updateCountryBorders(selectedCountryISO2);
  displayCountryInfo(selectedCountryISO2);
  displayPopulation(selectedCountryISO2);
  displayCurrency(selectedCountryISO2);

  // Optionally fetch weather based on the country's center lat/lon
  const country = countryBordersData.features.find(
    (feature) => feature.properties.iso_a2 === selectedCountryISO2
  );
  if (country) {
    const [lon, lat] = country.properties.center;
    displayWeather(lat, lon);
  }
});

// Geolocation: Center map on user's current location
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 10);

      // Reverse geocode to find country
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

// Populate dropdown on page load
populateCountryDropdown();
