<?php 
// Enable error reporting for debugging
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

// Open Exchange Rates API (Currency Names)
$currenciesUrl = "https://openexchangerates.org/api/currencies.json";

// Get the country ISO2 code from query string (e.g., 'US')
$iso2 = strtoupper(trim($_GET['iso2'] ?? ''));

// Check if country code is provided
if (empty($iso2)) {
    echo json_encode(["error" => "No country code provided."]);
    exit;
}

// Fetch currency data from Open Exchange Rates
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $currenciesUrl);
$currenciesResult = curl_exec($ch);
curl_close($ch);

// Validate API response
if (!$currenciesResult) {
    echo json_encode(["error" => "Failed to fetch currency data."]);
    exit;
}

$currenciesData = json_decode($currenciesResult, true);

// Fetch country-currency mapping from RestCountries API
$countryCurrencyUrl = "https://restcountries.com/v3.1/alpha/{$iso2}";
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $countryCurrencyUrl);
$countryResult = curl_exec($ch);
curl_close($ch);

// Validate country API response
if (!$countryResult) {
    echo json_encode(["error" => "Failed to fetch country data."]);
    exit;
}

$countryData = json_decode($countryResult, true);
if (!isset($countryData[0]['currencies'])) {
    echo json_encode(["error" => "No currency data found for country."]);
    exit;
}

// Extract currency details (code, name, symbol)
$currencyDetails = [];
foreach ($countryData[0]['currencies'] as $code => $details) {
    $currencyDetails[] = [
        'code' => $code,
        'name' => $currenciesData[$code] ?? $details['name'],
        'symbol' => $details['symbol'] ?? ''
    ];
}

// Return currency data as JSON
header('Content-Type: application/json');
echo json_encode([
    "country" => $iso2,
    "currencies" => $currencyDetails
]);
