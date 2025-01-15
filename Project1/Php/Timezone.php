<?php

// My GeoNames API key
$apiKey = "joedrumm12";

// Function to fetch country info
function getCountryList($apiKey) {
    $url = "http://api.geonames.org/countryInfoJSON?username=" . $apiKey;

    // Initialize cURL
    $curl = curl_init();

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

// Function to fetch time zone for given coordinates
function getTimeZone($latitude, $longitude, $apiKey) {
    $url = "http://api.geonames.org/timezoneJSON?lat=$latitude&lng=$longitude&username=" . $apiKey;

    // Initialize cURL
    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    // Execute the API request
    $response = curl_exec($curl);

    if (curl_errno($curl)) {
        echo "cURL Error: " . curl_error($curl);
        return null;
    }

    curl_close($curl);

    // Decode the JSON response
    $data = json_decode($res

?>
