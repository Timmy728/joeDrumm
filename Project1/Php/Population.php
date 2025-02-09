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
        echo json_encode(["error" => "cURL Error: " . curl_error($curl)]);
        exit;
    }

    // Close cURL session
    curl_close($curl);

    // Decode the JSON response
    $data = json_decode($response, true);

    return $data['geonames'] ?? null;
}

// Set the response header to JSON
header('Content-Type: application/json');

// Check if countryCode is provided in the request
if (isset($_GET['countryCode'])) {
    $countryCode = strtoupper($_GET['countryCode']); // Convert to uppercase

    $result = getCountryPopulations($apiKey);

    if ($result) {
        foreach ($result as $country) {
            if ($country['countryCode'] === $countryCode) {
                // Return JSON response with population
                echo json_encode(["population" => (int)$country['population']]);
                exit;
            }
        }
        // Return JSON response if country not found
        echo json_encode(["error" => "Country not found."]);
    } else {
        echo json_encode(["error" => "Error fetching population data."]);
    }
} else {
    echo json_encode(["error" => "No country code provided."]);
}

?>
