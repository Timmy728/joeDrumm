<?php
// Enable error reporting for debugging
ini_set('display_errors', 'On');
error_reporting(E_ALL);

// Open Exchange Rates API Key
$app_id = '39e1723bbec3413181d6bbe3c3d1d3c8';

// API URL (USD base currency is required on the free plan)
$url = "https://openexchangerates.org/api/latest.json?app_id=$app_id";

// Get country code (ISO2) from request
$iso2 = strtoupper(trim($_GET['iso2'] ?? ''));

// Validate input
if (empty($iso2)) {
    echo json_encode([
        "status" => ["code" => 400, "message" => "No country code provided."],
        "error" => "No country code provided."
    ]);
    exit;
}

// Get country data from RestCountries API
$countryApiUrl = "https://restcountries.com/v3.1/alpha/$iso2";
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $countryApiUrl);

// Execute the cURL request and fetch the response
$countryResult = curl_exec($ch);

// Check for cURL errors
if (curl_errno($ch)) {
    // If there's an error, output the error and stop execution
    echo json_encode([
        "status" => ["code" => 500, "message" => "Failed to fetch country data."],
        "error" => "cURL Error: " . curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

// Close the cURL session
curl_close($ch);

// Decode the JSON response from RestCountries API
$countryData = json_decode($countryResult, true);

// Check if the response contains the 'currencies' field
if (!isset($countryData[0]['currencies'])) {
    echo json_encode([
        "status" => ["code" => 404, "message" => "No currency data found for country."],
        "error" => "No currency data found for country."
    ]);
    exit;
}

// Get the currency code (e.g., USD for the United States)
$currencyCode = array_key_first($countryData[0]['currencies']);

// Fetch exchange rates from Open Exchange Rates API
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

// Execute the cURL request to get the exchange rate data
$response = curl_exec($ch);

// Check for cURL errors during the exchange rate request
if (curl_errno($ch)) {
    echo json_encode([
        "status" => ["code" => 500, "message" => "Failed to fetch exchange rates."],
        "error" => "cURL Error: " . curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

// Close the cURL session for the exchange rate request
curl_close($ch);

// Decode the exchange rate data
$data = json_decode($response, true);

// Validate that the exchange rate for the currency is available
if (!isset($data['rates'][$currencyCode])) {
    echo json_encode([
        "status" => ["code" => 404, "message" => "Exchange rate not available for $currencyCode."],
        "error" => "Exchange rate not available for $currencyCode."
    ]);
    exit;
}

// Get the exchange rate (USD to local currency)
$exchangeRate = $data['rates'][$currencyCode];

// Return a JSON response with the currency code and exchange rate
header('Content-Type: application/json');
echo json_encode([
    "status" => ["code" => 200, "message" => "Success"],
    "currencyCode" => $currencyCode,
    "exchangeRate" => $exchangeRate
]);
?>
