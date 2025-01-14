<?php

// My API Key
$apiKey = "405e0adb0071520e14c73f914452342b";

// Function to get country details by name
function getCountryByName($countryName, $apiKey) {
    // API URL with query parameters
    $url = "https://api.countrylayer.com/v2/name/" . urlencode($countryName) . "?access_key=" . $apiKey . "&fullText=true";

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

    return $data;
}


$countryName = "United Kingdom";
$result = getCountryByName($countryName, $apiKey);

// Check and display the result
if ($result && !isset($result['error'])) {
    echo "Country Details:\n";
    print_r($result);
} else {
    echo "Error fetching country data.\n";
}
?>
