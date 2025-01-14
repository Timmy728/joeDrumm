<?php

// My GeoName API key
$apiKey = "joedrumm12";

// Function to fetch population for all countries
function getCountryPopulations($apiKey) {
    // API URL for GeoNames countryInfo endpoint
    $url = "http://api.geonames.org/countryInfoJSON?username=" . $apiKey;

    // Initialize cURL
    $curl = curl_init();

    // Set cURL options
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    // Execute the API request
    $response = curl_exec($curl);

    // Handle errors
    if (curl_errno($curl)) {
        echo "cURL Error: " . curl_error($curl);
        return null;
    }

    // Close cURL session
    curl_close($curl);

    // Decode the JSON response
    $data = json_decode($response, true);

    return $data['geonames'] ?? null;
}

$result = getCountryPopulations($apiKey);

// Display population data
if ($result) {
    echo "List of Country Populations:\n\n";
    foreach ($result as $country) {
        $name = $country['countryName'] ?? "N/A";
        $population = $country['population'] ?? "N/A";
        echo "Country: $name, Population: $population\n";
    }
} else {
    echo "Error fetching population data.\n";
}
?>
