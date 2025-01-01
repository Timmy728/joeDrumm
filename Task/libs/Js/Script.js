// Street Name LookUp API
document.getElementById("btnStreetLookUp").addEventListener("click", function () {
    const streetName = document.getElementById("streetName").value;

    fetch("libs/php/streetNameLookUp.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ streetName: streetName }),
    })
        .then((response) => response.json()) // Fixed missing dot before "then"
        .then((result) => {
            console.log(result);
            if (result.status.name === "ok") {
                document.getElementById("txtStreetResult").innerHTML =
                    result.data[0].streetDetails || "No details found.";
            }
        })
        .catch((error) => console.error("Error:", error));
});

// Weather API Functionality
document.getElementById("btnWeather").addEventListener("click", function () {
    const location = document.getElementById("location").value;

    fetch("libs/php/weather.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ location: location }),
    })
        .then((response) => response.json())
        .then((result) => {
            console.log(result);
            if (result.status.name === "ok") {
                document.getElementById("txtWeatherResult").innerHTML =
                    result.data[0].weatherInfo || "Weather information not found.";
            }
        })
        .catch((error) => console.error("Error:", error));
});

// Country Code LookUp API Functionality
document.getElementById("btnCountryCode").addEventListener("click", function () {
    const countryName = document.getElementById("countryName").value; // Fixed missing closing parenthesis

    fetch("libs/php/countryCodeLookUp.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json", // Fixed typo "countent-Type" to "Content-Type"
        },
        body: JSON.stringify({ countryName: countryName }),
    })
        .then((response) => response.json())
        .then((result) => {
            console.log(result);
            if (result.status.name === "ok") { // Fixed missing closing parenthesis for "if"
                document.getElementById("txtCountryCodeResult").innerHTML =
                    result.data[0].countryCode || "Country code not found.";
            }
        })
        .catch((error) => console.error("Error:", error));
});
