<?php
// remove for production
ini_set('display_errors', 'On');
error_reporting(E_ALL);
$executionStartTime = microtime(true);

// API URL to get currency names
$currenciesUrl = "https://openexchangerates.org/api/currencies.json";

// Get the selected country ISO2 code from the query string
$iso2 = strtoupper(trim($_GET['iso2'])); // e.g., 'US'

// Check if the country code is provided
if (empty($iso2)) {
    echo json_encode(["error" => "No country code provided."]);
    exit;
}

// Fetch Currency Names from the API
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $currenciesUrl);
$currenciesResult = curl_exec($ch);
curl_close($ch);

// Check if API call was successful
if (!$currenciesResult) {
    echo json_encode(["error" => "Failed to fetch currency data."]);
    exit;
}

$currenciesData = json_decode($currenciesResult, true);

// Predefined currency mappings for countries (you can extend this list as needed)
$countryCurrencies = [
    'US' => 'USD', // US uses USD
    'GB' => 'GBP', // UK uses GBP
    'IN' => 'INR', // India uses INR
    'CA' => 'CAD', // Canada uses CAD
    'AU' => 'AUD', // Australia uses AUD
    'JP' => 'JPY', // Japan uses JPY
    'DE' => 'EUR', // Germany uses EUR
    'FR' => 'EUR', // France uses EUR
    'BR' => 'BRL', // Brazil uses BRL
    'CN' => 'CNY', // China uses CNY
    'RU' => 'RUB', // Russia uses RUB
    'IT' => 'EUR', // Italy uses EUR
    'MX' => 'MXN', // Mexico uses MXN
    // Add more countries as needed...
];

// Check if the country code exists in the countryCurrencies mapping
if (!isset($countryCurrencies[$iso2])) {
    echo json_encode(["error" => "Currency not found for the given country: " . $iso2]);
    exit;
}

$currencyCode = $countryCurrencies[$iso2];

// Get the full currency name
$currencyName = $currenciesData[$currencyCode] ?? 'Unknown Currency';

// Prepare output
$output = [
    'status' => [
        'code' => "200",
        'name' => "ok",
        'description' => "success",
        'returnedIn' => intval((microtime(true) - $executionStartTime) * 1000) . " ms"
    ],
    'currencyCode' => $currencyCode,
    'currencyName' => $currencyName
];

// Return the result as JSON
header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);
?>
