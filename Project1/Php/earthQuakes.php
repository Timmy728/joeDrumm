<?php
// My GeoNames API key
$apiKey = "joedrumm12";

// Function to fetch earthquake data
function getEarthquakes($north, $south, $east, $west, $maxRows, $apiKey) {
    // Construct the API URL
    $url = "http://api.geonames.org/earthquakesJSON?north=$north&south=$south&east=$east&west=$west&maxRows=$maxRows&username=" . $apiKey;

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

    return $data['earthquakes'] ?? null;
}

$north = 50.0; // Northern latitude
$south = 30.0; // Southern latitude
$east = 70.0;  // Eastern longitude
$west = 50.0;  // Western longitude
$maxRows = 10; // Number of results to fetch

$result = getEarthquakes($north, $south, $east, $west, $maxRows, $apiKey);

// Display earthquake data
if ($result) {
    echo "Recent Earthquakes:\n\n";
    foreach ($result as $quake) {
        $dateTime = $quake['datetime'] ?? "N/A";
        $magnitude = $quake['magnitude'] ?? "N/A";
        $depth = $quake['depth'] ?? "N/A";
        $lat = $quake['lat'] ?? "N/A";
        $lng = $quake['lng'] ?? "N/A";
        echo "Date/Time: $dateTime, Magnitude: $magnitude, Depth: $depth km, Location: ($lat, $lng)\n";
    }
} else {
    echo "No earthquake data found for the specified region.\n";
}

?>
