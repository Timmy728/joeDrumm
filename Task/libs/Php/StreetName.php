<?php
// Enable error reporting for debugging; remove for production
ini_set('display_errors', 'On');
error_reporting(E_ALL);

// Measure execution time
$executionStartTime = microtime(true);

// Construct API URL using $_REQUEST parameters
$url = 'http://api.geonames.org/findNearbyStreetsJSON?lat=' . $_REQUEST['lat'] .
    '&lng=' . $_REQUEST['lng'] .
    '&username=joedrumm12';

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

// Execute and close cURL
$result = curl_exec($ch);
curl_close($ch);

// Decode JSON response
$data = json_decode($result, true);

// Prepare output
$output = [
    'status' => [
        'code' => 200,
        'name' => 'ok',
        'description' => 'success',
        'returnedIn' => (intval((microtime(true) - $executionStartTime) * 1000)) . " ms",
    ],
    'data' => $data
];

// Return JSON response
header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);
?>
