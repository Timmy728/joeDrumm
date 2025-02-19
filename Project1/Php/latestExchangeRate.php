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
    echo json_encode(["error" => "No country code provided."]);
    exit;
}

// Get country data from RestCountries API
$countryApiUrl = "https://restcountries.com/v3.1/alpha/$iso2";
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $countryApiUrl);
$countryResult = curl_exec($ch);
curl_close($ch);

if (!$countryResult) {
    echo json_encode(["error" => "Failed to fetch country data."]);
    exit;
}

$countryData = json_decode($countryResult, true);
if (!isset($countryData[0]['currencies'])) {
    echo json_encode(["error" => "No currency data found for country."]);
    exit;
}

// Get currency code (e.g., GBP for UK)
$currencyCode = array_key_first($countryData[0]['currencies']);

// Fetch exchange rates
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

// Validate exchange rate data
if (!isset($data['rates'][$currencyCode])) {
    echo json_encode(["error" => "Exchange rate not available for $currencyCode."]);
    exit;
}

// Get exchange rate (USD to local currency)
$exchangeRate = $data['rates'][$currencyCode];

// Return JSON response
header('Content-Type: application/json');
echo json_encode([
    "currencyCode" => $currencyCode,
    "exchangeRate" => $exchangeRate
]);
?>
