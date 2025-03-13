<?php
// Enable error reporting for debugging
ini_set('display_errors', 'On');
error_reporting(E_ALL);

// Open Exchange Rates API Key
$app_id = '39e1723bbec3413181d6bbe3c3d1d3c8';

// API URL (USD base currency is required on the free plan)
$url = "https://openexchangerates.org/api/latest.json?app_id=$app_id";

// Get country code (ISO2) from request
$iso2 = isset($_GET['iso2']) ? strtoupper(trim($_GET['iso2'])) : '';

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

if (!isset($data['rates'])) {
    echo json_encode([
        "status" => ["code" => 500, "message" => "Failed to get exchange rates."],
        "error" => "No rates data available."
    ]);
    exit;
}

// Currency codes and their details exactly matching the HTML select options
$currencies = [
    'EUR' => ['name' => 'Euro', 'symbol' => '€'],
    'GBP' => ['name' => 'British Pound', 'symbol' => '£'],
    'JPY' => ['name' => 'Japanese Yen', 'symbol' => '¥'],
    'AUD' => ['name' => 'Australian Dollar', 'symbol' => 'A$'],
    'CAD' => ['name' => 'Canadian Dollar', 'symbol' => 'C$'],
    'CHF' => ['name' => 'Swiss Franc', 'symbol' => 'Fr'],
    'CNY' => ['name' => 'Chinese Yuan', 'symbol' => '¥'],
    'INR' => ['name' => 'Indian Rupee', 'symbol' => '₹'],
    'BRL' => ['name' => 'Brazilian Real', 'symbol' => 'R$'],
    'AED' => ['name' => 'UAE Dirham', 'symbol' => 'د.إ'],
    'ARS' => ['name' => 'Argentine Peso', 'symbol' => '$'],
    'THB' => ['name' => 'Thai Baht', 'symbol' => '฿']
];

// If a specific country is requested
if (!empty($iso2)) {
    // Get country data from RestCountries API
    $countryApiUrl = "https://restcountries.com/v3.1/alpha/$iso2";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL, $countryApiUrl);
    
    $countryResult = curl_exec($ch);
    
    if (curl_errno($ch)) {
        echo json_encode([
            "status" => ["code" => 500, "message" => "Failed to fetch country data."],
            "error" => "cURL Error: " . curl_error($ch)
        ]);
        curl_close($ch);
        exit;
    }
    
    curl_close($ch);
    
    $countryData = json_decode($countryResult, true);
    
    if (isset($countryData[0]['currencies'])) {
        $currencyCode = array_key_first($countryData[0]['currencies']);
        $exchangeRate = $data['rates'][$currencyCode] ?? null;
        
        // Return specific country data along with all available currencies
        echo json_encode([
            "status" => ["code" => 200, "message" => "Success"],
            "currencyCode" => $currencyCode,
            "exchangeRate" => $exchangeRate,
            "data" => array_map(function($code, $info) use ($data) {
                return [
                    $code,
                    $info['name'],
                    $data['rates'][$code] ?? null,
                    $info['symbol']
                ];
            }, array_keys($currencies), $currencies)
        ]);
    } else {
        echo json_encode([
            "status" => ["code" => 404, "message" => "No currency data found for country."],
            "error" => "No currency data found for country."
        ]);
    }
} else {
    // Return just the list of available currencies
    echo json_encode([
        "status" => ["code" => 200, "message" => "Success"],
        "data" => array_map(function($code, $info) use ($data) {
            return [
                $code,
                $info['name'],
                $data['rates'][$code] ?? null,
                $info['symbol']
            ];
        }, array_keys($currencies), $currencies)
    ]);
}
?>
