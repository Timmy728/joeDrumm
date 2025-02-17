<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// GeoNames API Key
$apiKey = "joedrumm12";

// Define the date range (1 year ago)
$minDate = date("Y-m-d", strtotime("-1 year")); // 1 year ago

// Function to fetch earthquake data
function getEarthquakes($north, $south, $east, $west, $maxRows, $apiKey, $minDate) {
    $url = "http://api.geonames.org/earthquakesJSON?north=$north&south=$south&east=$east&west=$west&maxRows=$maxRows&username=" . $apiKey;

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $response = curl_exec($curl);

    if (curl_errno($curl)) {
        echo json_encode(["error" => "cURL Error: " . curl_error($curl)]);
        return null;
    }

    curl_close($curl);
    $data = json_decode($response, true)['earthquakes'] ?? null;

    // Log received earthquake dates for debugging
    if ($data) {
        foreach ($data as $quake) {
            error_log("Earthquake Date: " . $quake['datetime']);
        }
    }

    // Filter earthquakes within the last 1 year
    if ($data) {
        $filteredData = array_filter($data, function ($quake) use ($minDate) {
            $quakeDate = date("Y-m-d", strtotime($quake['datetime']));
            return ($quakeDate >= $minDate);
        });

        if (empty($filteredData)) {
            return ["error" => "No earthquake data found in the last 1 year."];
        }

        return array_values($filteredData);
    }

    return ["error" => "No earthquake data found."];
}

// Function to get country coordinates
function getCountryBounds($countryCode, $apiKey) {
    $url = "http://api.geonames.org/countryInfoJSON?country=$countryCode&username=" . $apiKey;

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $response = curl_exec($curl);
    if (curl_errno($curl)) {
        echo json_encode(["error" => "cURL Error: " . curl_error($curl)]);
        return null;
    }

    curl_close($curl);
    $data = json_decode($response, true);

    if (!isset($data['geonames'][0])) {
        return null;
    }

    return $data['geonames'][0];
}

// Check if country parameter is provided
if (!isset($_GET['country'])) {
    echo json_encode(["error" => "No country parameter provided."]);
    exit;
}

$countryCode = $_GET['country'];
$countryData = getCountryBounds($countryCode, $apiKey);

if (!$countryData) {
    echo json_encode(["error" => "Unable to get coordinates for the selected country."]);
    exit;
}

$north = $countryData['north'];
$south = $countryData['south'];
$east = $countryData['east'];
$west = $countryData['west'];
$maxRows = 100; // Get more results

$result = getEarthquakes($north, $south, $east, $west, $maxRows, $apiKey, $minDate);

// Check if we got data, otherwise return an error
if (empty($result) || isset($result['error'])) {
    echo json_encode(["error" => "No data available or an error occurred."]);
} else {
    // Send back the earthquake data
    echo json_encode(["earthquakes" => $result]);
}
?>
