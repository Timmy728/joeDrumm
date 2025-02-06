<?php

ini_set('display_errors', 'On');
error_reporting(E_ALL);
$executionStartTime = microtime(true);

// API URL to get capital cities
$capitalsUrl = "https://restcountries.com/v3.1/all";

// Get the selected country ISO2 code from the query string
$iso2 = strtoupper(trim($_GET['iso2'])); // e.g., 'US'

// Check if the country code is provided
if (empty($iso2)) {
    echo json_encode(["error" => "No country code provided."]);
    exit;
}

// Fetch Country Information from the API
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $capitalsUrl);
$capitalsResult = curl_exec($ch);
curl_close($ch);

// Check if API call was successful
if (!$capitalsResult) {
    echo json_encode(["error" => "Failed to fetch country data."]);
    exit;
}

$capitalsData = json_decode($capitalsResult, true);

// Find the capital city by country ISO2 code
$capitalCity = null;

foreach ($capitalsData as $country) {
    if (isset($country['cca2']) && $country['cca2'] === $iso2) {
        $capitalCity = isset($country['capital']) ? $country['capital'][0] : null;
        break;
    }
}

// Return the result as JSON
if ($capitalCity) {
    echo json_encode(["capital" => $capitalCity]);
} else {
    echo json_encode(["error" => "Capital city not found for the provided country code."]);
}
?>
